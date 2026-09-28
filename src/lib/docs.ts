/**
 * Reading the content tree.
 *
 * The tree in `content/docs` is the site: the sidebar, the table of contents,
 * the prev/next links, the sitemap and the search index are all derived from
 * it. Nothing about the navigation is hand-maintained, because a navigation
 * tree maintained by hand is a navigation tree that will lie.
 */

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { cache } from "react";
import { SECTIONS, type Frontmatter, type TemplateId } from "./content-contract";
import { CONTENT_DIR } from "./paths";

export type DocPage = Frontmatter & {
  /** `/docs/language/syntax` */
  slug: string;
  /** Path on disk, for reading the body. */
  file: string;
};

export type DocSection = {
  title: string;
  slug: string;
  blurb: string;
  /** The section index page, if it wrote one. */
  index?: DocPage;
  pages: DocPage[];
};

/** Frontmatter, read without a YAML dependency — see validate-mdx.ts. */
export function parseFrontmatter(front: string): Frontmatter {
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
    if (raw === "") out[key] = [];
    else if (raw.startsWith("[")) {
      out[key] = raw
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map((s) => unquote(s.trim()))
        .filter(Boolean);
    } else out[key] = unquote(raw);
  }
  return out as unknown as Frontmatter;
}

function unquote(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

export function splitFrontmatter(text: string): { front: string; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return { front: "", body: text };
  return { front: m[1], body: text.slice(m[0].length) };
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".mdx")) out.push(full);
  }
  return out;
}

/**
 * Every page, once, cached for the process.
 *
 * `cache` de-duplicates across a single render pass, which matters because the
 * layout, the page and the sidebar all ask for the same tree.
 */
export const allPages = cache((): DocPage[] => {
  const dir = CONTENT_DIR;
  const pages = walk(dir).map((file): DocPage => {
    const text = readFileSync(file, "utf8");
    const { front } = splitFrontmatter(text);
    // A section's `index.mdx` is that section's page: `/docs/language`, not
    // `/docs/language/index`. The directory name is what the URL should say.
    let slug = "/docs/" + relative(dir, file).replace(/\.mdx$/, "").split(sep).join("/");
    if (slug.endsWith("/index")) slug = slug.slice(0, -"/index".length);
    return { ...parseFrontmatter(front), slug, file };
  });
  return pages.sort((a, b) => a.slug.localeCompare(b.slug));
});

/** The sidebar, in the order SECTIONS declares, pages in frontmatter order. */
export const docSections = cache((): DocSection[] => {
  const pages = allPages();
  return SECTIONS.map((s) => {
    const inSection = pages.filter((p) => p.section === s.title);
    const index = inSection.find((p) => p.slug === `/docs/${s.slug}`);
    return {
      ...s,
      index,
      pages: inSection
        .filter((p) => p !== index)
        .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)),
    };
  }).filter((s) => s.index || s.pages.length > 0);
});

export function pageBySlug(slug: string = ""): DocPage | undefined {
  const clean = slug.replace(/\/$/, "") || "/";
  return allPages().find((p) => p.slug === clean);
}

export function pageBody(page: DocPage): string {
  return splitFrontmatter(readFileSync(page.file, "utf8")).body;
}

/** The previous and next page, in reading order. */
export function pager(slug: string): { prev?: DocPage; next?: DocPage } {
  const flat = docSections().flatMap((s) => (s.index ? [s.index, ...s.pages] : s.pages));
  const i = flat.findIndex((p) => p.slug === slug);
  if (i === -1) return {};
  return { prev: i > 0 ? flat[i - 1] : undefined, next: i < flat.length - 1 ? flat[i + 1] : undefined };
}

export type Heading = { level: number; text: string; id: string };

/** H2 and H3 headings, for the table of contents and for anchor links. */
export function tableOfContents(body: string): Heading[] {
  const out: Heading[] = [];
  let inFence = false;
  for (const raw of body.split(/\r?\n/)) {
    if (/^```/.test(raw)) inFence = !inFence;
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.*)$/.exec(raw);
    if (!m) continue;
    const text = m[2].replace(/\s*\{#.*$/, "").replace(/[*`]/g, "").trim();
    out.push({ level: m[1].length, text, id: headingId(text) });
  }
  return out;
}

export function headingId(s: string): string {
  return s
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** The template a page declares, for the banner the layout shows. */
export function templateOf(page: DocPage): TemplateId {
  return (page.template ?? "concept") as TemplateId;
}
