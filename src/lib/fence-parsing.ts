/**
 * Reading fenced code blocks out of Markdown.
 *
 * One implementation, shared by the validator and the formatter. Two parsers
 * would be two chances to disagree about which fences exist, and a validator
 * that parses fences differently from the formatter is worse than no
 * validator: it reports the tree as clean while missing every snippet.
 */

import { VALIDATED_LANGUAGES } from "./content-contract";

export type Fence = {
  /** The language, lowercased. Empty for a bare fence. */
  lang: string;
  /** Everything after the language on the info line: `title=main.hard`. */
  meta: string;
  code: string;
  /** Line index of the opening fence. */
  start: number;
  /** Line index of the closing fence. */
  end: number;
};

/**
 * Fenced blocks, in order.
 *
 * The info string is split the way the Markdown parser splits it: language
 * first, then metadata. So ```hard title=main.hard is a HardScript fence with a
 * filename, not an unknown language.
 */
export function fences(body: string): Fence[] {
  const out: Fence[] = [];
  const lines = body.split(/\r?\n/);
  let open: { lang: string; meta: string; start: number; buf: string[] } | null = null;
  for (let i = 0; i < lines.length; i += 1) {
    if (!open) {
      const m = /^```(\S*)(.*)$/.exec(lines[i]);
      if (m) open = { lang: m[1].toLowerCase(), meta: m[2].trim(), start: i, buf: [] };
      continue;
    }
    if (/^```\s*$/.test(lines[i])) {
      out.push({ lang: open.lang, meta: open.meta, code: open.buf.join("\n"), start: open.start, end: i });
      open = null;
      continue;
    }
    open.buf.push(lines[i]);
  }
  return out;
}

/** Is this fence in a language the build compiles? */
export function isValidated(fence: Fence): boolean {
  return VALIDATED_LANGUAGES.has(fence.lang);
}

/**
 * Is this snippet a whole program?
 *
 * A fragment cannot be compiled: the diagnostic would be about the missing
 * `app` line, not about the page. The markers below are the way a page says
 * "this is an excerpt" — an ellipsis, a comment, or a body with no port
 * declaration.
 */
export function isProgram(code: string): boolean {
  if (/^\s*(\.\.\.|#\s)/m.test(code)) return false;
  return /\bapp\s+@\d+/.test(code);
}
