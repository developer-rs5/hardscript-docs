/**
 * Syntax highlighting.
 *
 * Shiki runs on the server: highlighting at build time means no grammar is
 * shipped to the browser, and the same HTML is cached with the page. The
 * grammar list is the whole of HardScript plus the languages that appear in
 * docs (TOML, JSON, shell, SQL), loaded lazily by Shiki.
 */

import { codeToHtml, bundledLanguages, type ShikiTransformer } from "shiki";
import type { Element } from "hast";

/** The languages HardScript documentation is allowed to highlight. */
const ALLOWED = new Set([
  "hard",
  "hardscript",
  "typescript",
  "javascript",
  "json",
  "toml",
  "shellscript",
  "bash",
  "sql",
  "yaml",
  "diff",
  "text",
  "markdown",
  "rust",
  "cpp",
  "dockerfile",
  "ini",
  "http",
  "graphql",
  "python",
  "go",
]);

const THEMES = {
  light: "github-light",
  dark: "github-dark",
} as const;

export type HighlightOptions = {
  lang?: string;
  theme?: keyof typeof THEMES;
  /** Show line numbers in a gutter. */
  lineNumbers?: boolean;
  /** Highlight these 1-based line numbers. */
  highlight?: number[];
};

/** Map a fence language to a Shiki language id, defaulting to plain text. */
export function resolveLang(lang: string | undefined): string {
  if (!lang) return "text";
  const id = lang.toLowerCase();
  if (id === "hard" || id === "hardscript" || id === "hs") return "rust";
  if (id === "sh" || id === "shell" || id === "console") return "bash";
  if (id === "shellscript") return "bash";
  if (id === "yml") return "yaml";
  if (!ALLOWED.has(id)) return "text";
  if (id in bundledLanguages) return id;
  return "text";
}

/** Highlight a snippet. Returns HTML with inline styles, safe to inject. */
export async function highlight(code: string, options: HighlightOptions = {}) {
  const lang = resolveLang(options.lang);
  try {
    return await codeToHtml(code, {
      lang,
      themes: { light: THEMES.light, dark: THEMES.dark },
      defaultColor: options.theme === "dark" ? "dark" : "light",
      transformers: [lineTransformer(options)],
    });
  } catch {
    // A missing grammar must never take a page down: fall back to escaped text.
    return `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`;
  }
}

function lineTransformer(options: HighlightOptions): ShikiTransformer {
  return {
    name: "hard-lines",
    line(node: Element, line: number) {
      if (options.lineNumbers) {
        node.properties["data-line"] = String(line);
      }
      if (options.highlight?.includes(line)) {
        node.properties.class = `${node.properties.class ?? ""} hl`.trim();
      }
    },
  };
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Validate a snippet at build time.
 *
 * Documentation that does not compile is worse than no documentation, because
 * an assistant will copy it. Every fenced block with a `hard` language is
 * checked against this list of invariants; `scripts/validate-mdx.ts` runs it
 * over the whole content tree.
 */
export const HARD_SNIPPET_RULES: { rule: string; test: RegExp }[] = [
  { rule: "models use `field => Type`, not `field : Type`, in the bracket form", test: /^\s*model\s+\w+\s*=\s*\w+\s*\[/ },
];
