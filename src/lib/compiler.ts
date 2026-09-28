/**
 * Locating the HardScript compiler, and asking it questions.
 *
 * The documentation is only trustworthy if every snippet in it compiles, so
 * the build runs the real compiler over the snippets. That means finding the
 * binary. Three sources, in order:
 *
 *   1. `HARD_BIN` — an explicit path, which is what CI should set.
 *   2. A sibling checkout of the compiler repository, in either the release or
 *      the debug profile. This is how a developer works: both repos on disk.
 *   3. `hard` on PATH.
 *
 * If none of them exist the validators do not silently pass. They report that
 * snippets were not checked, and exit non-zero, because "unverified docs" is
 * the one outcome this project is not allowed to ship.
 */

import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { REPO_ROOT } from "./paths";

export { REPO_ROOT } from "./paths";

/** Where the compiler repository usually sits relative to this one. */
const SIBLING_CANDIDATES = [
  join(REPO_ROOT, "..", "hardscript"),
  join(REPO_ROOT, "..", "hard-script"),
  "/home/rishabh/Projects/hardscript",
];

let cached: string | null | undefined;

/** The path to the compiler, or null when it cannot be found. */
export function findCompiler(): string | null {
  if (cached !== undefined) return cached;
  cached = null;

  const explicit = process.env.HARD_BIN;
  if (explicit && existsSync(explicit)) {
    cached = explicit;
    return cached;
  }

  for (const repo of SIBLING_CANDIDATES) {
    for (const profile of ["release", "debug"]) {
      const candidate = join(repo, "target", profile, "hard");
      if (existsSync(candidate)) {
        cached = candidate;
        return cached;
      }
    }
  }

  for (const dir of (process.env.PATH ?? "").split(":")) {
    if (!dir) continue;
    const candidate = join(dir, "hard");
    if (existsSync(candidate)) {
      cached = candidate;
      return cached;
    }
  }
  return cached;
}

/** The compiler's version line, for reports. */
export function compilerVersion(bin = findCompiler()): string {
  if (!bin) return "not found";
  try {
    return execFileSync(bin, ["--version"], { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

/** A single diagnostic: the code, the message, and the line it pointed at. */
export type Diagnostic = {
  code?: string;
  message: string;
  line?: number;
  file?: string;
  severity: "error" | "warning";
};

/** How a diagnostic reads once the temporary path is removed. */
export function formatDiagnostic(d: Diagnostic): string {
  const at = d.line ? ` (${d.file ?? "main.hard"}:${d.line})` : "";
  return `${d.severity}[${d.code ?? "----"}]${at}: ${d.message}`;
}

export type BuildResult = {
  ok: boolean;
  /** Compiler diagnostics, already stripped of absolute paths. */
  diagnostics: Diagnostic[];
  stdout: string;
};

/**
 * Compile one HardScript source with the real compiler.
 *
 * The snippet is written into a temporary directory with the file name the
 * compiler expects (`main.hard`) so the diagnostics a reader would see are the
 * diagnostics they would see.
 */
export function buildSource(source: string, label = "main.hard"): BuildResult {
  const bin = findCompiler();
  if (!bin) {
    return {
      ok: false,
      diagnostics: [
        { severity: "error", message: "no HardScript compiler found" },
      ],
      stdout: "",
    };
  }
  const dir = mkdtempSync(join(tmpdir(), "hard-docs-build-"));
  const file = join(dir, label);
  try {
    writeFileSync(file, source, "utf8");
    let stdout = "";
    let ok = true;
    try {
      stdout = execFileSync(bin, ["build", file], {
        cwd: dir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 120_000,
      });
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string };
      stdout = `${e.stdout ?? ""}${e.stderr ?? ""}`;
      ok = false;
    }
    return { ok, diagnostics: ok ? [] : parseDiagnostics(stdout, dir), stdout: scrub(stdout, dir) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Ask the formatter whether a snippet is already canonical.
 *
 * Trailing blank lines are excluded from the comparison. `hard fmt` ends every
 * file with two of them, and a fenced block in Markdown cannot express that:
 * trailing blank lines inside a fence are not part of what renders, are not
 * part of what a reader copies, and are not part of what the compiler reads.
 * Failing on them would mean every snippet on the site needed an invisible
 * two-line suffix, and the check would train people to ignore it.
 */
export function checkFormat(source: string): { ok: boolean; message: string } {
  const bin = findCompiler();
  if (!bin) return { ok: true, message: "" };
  const dir = mkdtempSync(join(tmpdir(), "hard-docs-fmt-"));
  const file = join(dir, "main.hard");
  try {
    writeFileSync(file, source, "utf8");
    let reported = "";
    try {
      const out = execFileSync(bin, ["fmt", "--check", file], {
        cwd: dir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 60_000,
      });
      return { ok: true, message: out.trim() };
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string };
      reported = `${e.stdout ?? ""}${e.stderr ?? ""}`.trim();
    }
    // `hard fmt --check` compares bytes, including the trailing blank lines.
    // Format a copy and compare what would actually be rendered.
    try {
      execFileSync(bin, ["fmt", file], { cwd: dir, stdio: "ignore", timeout: 60_000 });
    } catch {
      return { ok: false, message: reported };
    }
    const formatted = readFileSync(file, "utf8");
    if (formatted.trimEnd() === source.trimEnd()) return { ok: true, message: "" };
    return { ok: false, message: reported };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * What the formatter would change, line by line.
 *
 * A check that only says "not formatted" makes the author guess. This formats a
 * copy and diffs it, so the report can say which lines differ — and the author
 * can paste the fix instead of opening the compiler.
 */
export function formatDiff(source: string, context = 2): string {
  const bin = findCompiler();
  if (!bin) return "";
  const dir = mkdtempSync(join(tmpdir(), "hard-docs-fmtdiff-"));
  const file = join(dir, "main.hard");
  try {
    writeFileSync(file, source, "utf8");
    try {
      execFileSync(bin, ["fmt", file], { cwd: dir, stdio: "ignore", timeout: 60_000 });
    } catch {
      return "";
    }
    const formatted = readFileSync(file, "utf8");
    if (formatted.trimEnd() === source.trimEnd()) return "";
    return unifiedDiff(source, formatted, context);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * A line diff, small enough to read in a terminal.
 *
 * Long unchanged runs are elided; the point is to show the lines that moved,
 * not to reproduce the snippet.
 */
export function unifiedDiff(before: string, after: string, context = 2): string {
  const a = before.split("\n");
  const b = after.split("\n");
  // Longest common subsequence over lines, table-sized for the snippets here.
  const n = a.length;
  const m = b.length;
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const out: string[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    const start = Math.max(0, Math.min(i, j) - context);
    out.push(`@@ line ${Math.min(i, j) + 1} @@`);
    for (let k = start; k < Math.min(i, j) + context; k += 1) {
      if (k < n) out.push(`  ${a[k]}`);
    }
    while (i < n && j < m && a[i] !== b[j]) {
      if (lcs[i + 1][j] >= lcs[i][j + 1]) {
        out.push(`- ${a[i]}`);
        i += 1;
      } else {
        out.push(`+ ${b[j]}`);
        j += 1;
      }
    }
    out.push("  ---");
  }
  while (i < n) {
    out.push(`- ${a[i]}`);
    i += 1;
  }
  while (j < m) {
    out.push(`+ ${b[j]}`);
    j += 1;
  }
  return out.join("\n");
}

/**
 * Parse the compiler's diagnostic output.
 *
 * The format is stable and small, so this stays a parser rather than asking
 * the compiler for JSON:
 *
 * ```text
 * error[HS0002]: expected ']' to close a model
 *    --> /tmp/x/main.hard:3:20
 *     |
 *   3 |     email => Email @unique,
 * ```
 */
export function parseDiagnostics(text: string, stripDir?: string): Diagnostic[] {
  const out: Diagnostic[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const m = /^(\s*)(error|warning|note)\[([A-Z]{2}\d{4})\]:\s*(.*)$/.exec(lines[i]);
    if (!m) continue;
    const d: Diagnostic = {
      severity: m[2] as "error" | "warning",
      code: m[3],
      message: scrub(m[4], stripDir),
    };
    const loc = /-->\s+(.*?):(\d+):(\d+)/.exec(lines[i + 1] ?? "");
    if (loc) {
      d.file = scrub(loc[1], stripDir);
      d.line = Number(loc[2]);
    }
    out.push(d);
  }
  return out;
}

/** Remove temporary paths so diagnostics are stable across machines. */
export function scrub(text: string, stripDir?: string): string {
  let out = text;
  if (stripDir) out = out.split(stripDir).join("");
  out = out.replace(/\/tmp\/[a-z-]+[A-Za-z0-9._-]*/g, "<tmp>");
  out = out.replace(/\/home\/[^\s:]+/g, "<path>");
  return out;
}
