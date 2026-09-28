/**
 * Rewrites HardScript snippets in the content tree into the form `hard fmt`
 * produces.
 *
 * The validator checks this, so this is the fix it suggests. A docs tree where
 * 200 pages carry hand-formatted HardScript will drift from the formatter
 * within a week; a docs tree that is formatted by the same binary that
 * formats the reader's code cannot.
 *
 * Snippets that do not compile are left alone: there is nothing to format
 * until the compiler is happy, and guessing at the canonical form of a program
 * the parser rejects produces a different, still-wrong program.
 *
 * Usage: npm run docs:format [-- --check]
 */

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync as write } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildSource, checkFormat, findCompiler } from "../src/lib/compiler";
import { CONTENT_DIR, REPO_ROOT } from "../src/lib/paths";
import { fences, isProgram, isValidated } from "../src/lib/fence-parsing";

function formatSource(source: string): string | null {
  const bin = findCompiler();
  if (!bin) return null;
  const dir = mkdtempSync(join(tmpdir(), "hard-docs-fmt-write-"));
  const file = join(dir, "main.hard");
  try {
    write(file, source, "utf8");
    execFileSync(bin, ["fmt", file], { cwd: dir, stdio: "ignore", timeout: 60_000 });
    return readFileSync(file, "utf8");
  } catch {
    return null;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
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

function main() {
  const check = process.argv.includes("--check");
  if (!findCompiler()) {
    console.error("no compiler found: set HARD_BIN or build the compiler in a sibling checkout");
    process.exit(1);
  }
  const files = walk(CONTENT_DIR);
  let changed = 0;
  let formatted = 0;
  let broken = 0;

  for (const file of files) {
    const text = readFileSync(file, "utf8");
    const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
    const front = m ? m[0] : "";
    const body = text.slice(front.length);
    const snippets = fences(body).filter(isValidated);

    if (snippets.length === 0) continue;

    // Walk backwards so line offsets stay valid as we replace.
    const lines = body.split(/\r?\n/);
    for (const snippet of snippets) {
      if (!isProgram(snippet.code)) continue;
      if (!buildSource(snippet.code).ok) {
        broken += 1;
        continue;
      }
      if (checkFormat(snippet.code).ok) continue;
      const canonical = formatSource(snippet.code);
      if (canonical === null) continue;
      const next = canonical.replace(/\n+$/, "");
      if (next === snippet.code.replace(/\n+$/, "")) continue;
      lines.splice(snippet.start + 1, snippet.end - snippet.start - 1, ...next.split("\n"));
      formatted += 1;
    }

    const nextBody = lines.join("\n");
    if (nextBody !== body) {
      writeFileSync(file, front + nextBody, "utf8");
      changed += 1;
      console.log(`  ${file.replace(`${REPO_ROOT}/`, "")}`);
    }
  }

  if (broken > 0) {
    console.log("");
    console.log(`  ${broken} snippet(s) do not compile and were left alone`);
  }
  console.log(
    check
      ? `docs:format: ${formatted} snippet(s) need formatting`
      : `docs:format: ${formatted} snippet(s) reformatted across ${changed} page(s)`,
  );
  if (check && formatted > 0) process.exit(1);
}

main();
