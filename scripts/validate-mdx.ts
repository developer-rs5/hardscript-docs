/**
 * Validates the content tree.
 *
 * This is the gate that makes "the docs are the source of truth" mean
 * something. It checks, for every page:
 *
 *   - frontmatter is present and complete
 *   - the template's required sections are all there
 *   - every fenced HardScript snippet **compiles**, with the real compiler
 *   - snippets are formatted the way `hard fmt` would format them
 *   - internal links point at a page that exists
 *   - no unsupported performance claim
 *
 * Exits non-zero on any failure, printing every failure rather than the first.
 */

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import {
  FENCE_LANGUAGES,
  FORBIDDEN_CLAIMS,
  TEMPLATE_SECTIONS,
  type Frontmatter,
  type TemplateId,
} from "../src/lib/content-contract";
import {
  buildSource,
  checkFormat,
  compilerVersion,
  findCompiler,
  formatDiagnostic,
  formatDiff,
} from "../src/lib/compiler";
import { REPO_ROOT, CONTENT_DIR } from "../src/lib/paths";
import { fences, isProgram, isValidated } from "../src/lib/fence-parsing";

type Failure = { file: string; message: string; detail?: string };

const failures: Failure[] = [];
const stats = {
  pages: 0,
  snippets: 0,
  compiled: 0,
  skipped: 0,
  links: 0,
  limitations: 0,
};

/** Every `.mdx` in the content tree. */
function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".mdx") || full.endsWith(".md")) out.push(full);
  }
  return out;
}

/** Split a page into frontmatter and body. */
function splitFrontmatter(text: string): { front: string; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return { front: "", body: text };
  return { front: m[1], body: text.slice(m[0].length) };
}

/**
 * A deliberately small YAML reader: the frontmatter we allow is a flat map of
 * scalars and inline string arrays, and a dependency that parses YAML would be
 * a dependency that changes how these files are read.
 */
function parseFrontmatter(front: string): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  let key = "";
  for (const rawLine of front.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+#.*$/, "");
    if (!line.trim()) continue;
    const item = /^\s*-\s+(.*)$/.exec(line);
    if (item && key) {
      const list = (out[key] as string[]) ?? [];
      list.push(unquote(item[1].trim()));
      out[key] = list;
      continue;
    }
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    key = kv[1];
    const raw = kv[2].trim();
    if (raw === "") {
      out[key] = [];
    } else if (raw.startsWith("[")) {
      out[key] = raw
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map((s) => unquote(s.trim()))
        .filter(Boolean);
    } else {
      out[key] = unquote(raw);
    }
  }
  return out;
}

function unquote(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

/** H2 headings, used for the required-section check and the table of contents. */
function headings(body: string): { level: number; text: string; id: string }[] {
  const out: { level: number; text: string; id: string }[] = [];
  let inFence = false;
  for (const raw of body.split(/\r?\n/)) {
    if (/^```/.test(raw)) inFence = !inFence;
    if (inFence) continue;
    const m = /^(#{1,4})\s+(.*)$/.exec(raw);
    if (!m) continue;
    const text = m[2].replace(/\s*\{#.*$/, "").replace(/\*\*?/g, "").trim();
    out.push({ level: m[1].length, text, id: slugify(text) });
  }
  return out;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Internal links, so a page cannot point at a page that was never written. */
function internalLinks(body: string): string[] {
  const out: string[] = [];
  const re = /\]\((\/[^)#\s]*)(#[^)\s]*)?\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) out.push(m[1]);
  return out;
}

function fail(file: string, message: string, detail?: string) {
  failures.push({ file, message, detail });
}

/** Routes that exist outside the content tree. */
const STATIC_ROUTES = new Set([
  "/",
  "/install",
  "/docs",
  "/learn",
  "/playground",
  "/examples",
  "/packages",
  "/benchmark",
  "/deploy",
  "/registry",
  "/cli",
  "/orm",
  "/runtime",
  "/api-reference",
  "/blog",
  "/changelog",
  "/community",
  "/about",
  "/search",
]);

/** Pages the site is allowed to link to before they are written. */
const ALLOWED_PENDING = STATIC_ROUTES;

function main() {
  const contentDir = CONTENT_DIR;
  const files = walk(contentDir);
  const bin = findCompiler();

  console.log("content validation");
  console.log(`  compiler: ${bin ?? "NOT FOUND"} (${compilerVersion()})`);
  if (!bin) {
    console.log("");
    console.log("  No HardScript compiler was found, so no snippet can be checked.");
    console.log("  Set HARD_BIN, or build the compiler in a sibling checkout.");
    console.log("  Refusing to report success on unvalidated snippets.");
    process.exit(1);
  }
  console.log(`  pages: ${files.length}`);

  // The registry is read first: a callout is checked against it, and it is
  // itself a page like any other.
  const registryFile = join(contentDir, "limitations", "index.mdx");
  const registryIds = new Set<string>();
  const registryBody = existsSync(registryFile) ? readFileSync(registryFile, "utf8") : "";
  for (const m of registryBody.matchAll(/<Limitation[\s\S]*?id="([^"]+)"/g)) {
    registryIds.add(m[1]);
  }
  const usedIds = new Set<string>();
  for (const file of files) {
    for (const m of readFileSync(file, "utf8").matchAll(/<Limitation[\s\S]*?id="([^"]+)"/g)) {
      usedIds.add(m[1]);
    }
  }
  for (const id of registryIds) {
    // An entry nothing links to is a gap documented for an audience that has
    // not arrived yet, which is how a registry goes stale.
    if (!usedIds.has(id) && id !== registryFile) {
      failures.push({
        file: "content/docs/limitations/index.mdx",
        message: `Known Limitation '${id}' is registered but no page links to it`,
      });
    }
  }

  const known = new Set<string>();
  for (const f of files) {
    // `/docs/language/syntax` — the prefix matters, or every internal link
    // looks broken and the check is worthless. An `index.mdx` is its section's
    // page, so the trailing `/index` goes too.
    let slug = "/docs/" + relative(contentDir, f).replace(/\.mdx?$/, "").split(sep).join("/");
    if (slug.endsWith("/index")) slug = slug.slice(0, -"/index".length);
    known.add(slug);
  }

  for (const file of files) {
    const rel = relative(REPO_ROOT, file);
    const text = readFileSync(file, "utf8");
    const { front, body } = splitFrontmatter(text);
    stats.pages += 1;

    // -- frontmatter -----------------------------------------------------
    const fm = parseFrontmatter(front) as unknown as Frontmatter;
    if (!front) fail(rel, "no frontmatter");
    for (const key of ["title", "description", "section", "order", "template"] as const) {
      if (fm[key] === undefined || fm[key] === "") fail(rel, `frontmatter is missing \`${key}\``);
    }
    const template = (fm.template ?? "concept") as TemplateId;
    if (!(template in TEMPLATE_SECTIONS)) {
      fail(rel, `unknown template '${template}'`);
    }

    // -- required sections -----------------------------------------------
    const hs = headings(body);
    const titles = new Set(hs.map((h) => h.text.toLowerCase()));
    for (const section of TEMPLATE_SECTIONS[template] ?? []) {
      if (!titles.has(section.toLowerCase())) {
        fail(rel, `template '${template}' requires a section: ${section}`);
      }
    }

    // -- claims -----------------------------------------------------------
    for (const claim of FORBIDDEN_CLAIMS) {
      const m = claim.exec(body);
      if (m) {
        fail(
          rel,
          "unsupported performance claim",
          `"${m[0]}" — either measure it and cite the benchmark, or reword it.`,
        );
      }
    }

    // -- snippets ---------------------------------------------------------
    for (const snippet of fences(body)) {
      const line = snippet.start + 1;
      if (snippet.lang && !FENCE_LANGUAGES.has(snippet.lang)) {
        fail(rel, `unknown fence language '${snippet.lang}' at line ${line}`);
        continue;
      }
      if (!isValidated(snippet)) continue;
      stats.snippets += 1;

      // A fragment is not a program: compiling it would fail for reasons that
      // have nothing to do with the page.
      if (!isProgram(snippet.code)) {
        stats.skipped += 1;
        continue;
      }

      const result = buildSource(snippet.code, "main.hard");
      if (!result.ok) {
        const diags = result.diagnostics.length
          ? result.diagnostics.map(formatDiagnostic)
          : ["compilation failed with no diagnostic"];
        fail(
          rel,
          `a HardScript snippet does not compile (fence at line ${line})`,
          diags.join("\n"),
        );
        continue;
      }
      stats.compiled += 1;

      const fmt = checkFormat(snippet.code);
      if (!fmt.ok) {
        fail(
          rel,
          `a snippet is not formatted the way \`hard fmt\` would format it (fence at line ${line})`,
          formatDiff(snippet.code) || fmt.message,
        );
      }
    }

    // -- limitations registry ---------------------------------------------
    // A callout that points at a gap nobody is tracking is worse than no
    // callout: it promises a fix that has no record. So every id used must be
    // an entry in the registry, and every entry must be used.
    for (const m of body.matchAll(/<Limitation[\s\S]*?id="([^"]+)"/g)) {
      const id = m[1];
      stats.limitations += 1;
      if (!registryIds.has(id)) {
        fail(rel, `Known Limitation '${id}' has no entry in /docs/limitations`);
      }
    }

    // -- links -------------------------------------------------------------
    for (const href of internalLinks(body)) {
      stats.links += 1;
      const clean = href.replace(/\/$/, "") || "/";
      if (known.has(clean) || STATIC_ROUTES.has(clean)) continue;
      if (ALLOWED_PENDING.has(clean)) continue;
      fail(rel, `link to a page that does not exist: ${href}`);
    }
  }

  // -- report ------------------------------------------------------------
  console.log(
    `  checked ${stats.snippets} HardScript snippets (${stats.compiled} compiled, ${stats.skipped} fragments skipped), ${stats.links} internal links and ${stats.limitations} limitation callouts`,
  );
  console.log("");
  if (failures.length === 0) {
    console.log(`content: ${stats.pages} pages, no problems`);
    return 0;
  }
  console.log(`content: ${failures.length} problem(s)`);
  console.log("");
  for (const f of failures) {
    console.log(`  ${f.file}`);
    console.log(`    ${f.message}`);
    if (f.detail) {
      for (const line of f.detail.split("\n")) console.log(`      ${line}`);
    }
    console.log("");
  }
  return 1;
}

process.exit(main());
