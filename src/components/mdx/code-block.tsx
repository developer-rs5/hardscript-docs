import { highlight } from "@/lib/code";
import { CopyButton } from "./copy-button";

/**
 * A code block.
 *
 * Highlighting happens on the server at build time, so no grammar ships to the
 * browser and the HTML is cached with the page. The copy button is the only
 * client-side part, and it degrades to plain text selection without
 * JavaScript.
 */
export async function CodeBlock({
  code,
  lang = "text",
  filename,
  caption,
  lineNumbers = false,
  highlightLines = [],
  showCopy = true,
}: {
  code: string;
  lang?: string;
  filename?: string;
  caption?: string;
  lineNumbers?: boolean;
  highlightLines?: number[];
  showCopy?: boolean;
}) {
  const html = await highlight(code, { lang, lineNumbers, highlight: highlightLines });
  return (
    <figure className="group not-prose my-6 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--code-bg)]">
      {filename || caption ? (
        <figcaption className="flex items-center gap-2 border-b border-[var(--line)] px-3.5 py-2 text-[12px] text-[var(--ink-subtle)]">
          {filename ? <span className="font-mono">{filename}</span> : null}
          {caption ? <span>{caption}</span> : null}
        </figcaption>
      ) : null}
      <div className="relative">
        <pre
          className={`shiki overflow-x-auto px-4 py-3.5 text-[13px] leading-[1.7] ${
            lineNumbers ? "[&_code]:counter-reset-none" : ""
          }`}
          data-lang={lang}
        >
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
        {showCopy ? <CopyButton code={code} /> : null}
      </div>
    </figure>
  );
}

/** An inline code span. */
export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded border border-[var(--line)] bg-[var(--code-bg)] px-1.5 py-0.5 font-mono text-[0.85em] text-[var(--ink)]">
      {children}
    </code>
  );
}

/** A shell session, so a command and its output are visually one unit. */
export async function Terminal({
  title = "terminal",
  children,
}: {
  title?: string;
  children: string;
}) {
  const lines = children.replace(/\n+$/, "").split("\n");
  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--code-bg)]">
      <div className="flex items-center gap-2 border-b border-[var(--line)] px-3.5 py-2 text-[12px] text-[var(--ink-subtle)]">
        <span className="size-2.5 rounded-full bg-[var(--line)]" aria-hidden />
        <span className="font-mono">{title}</span>
      </div>
      <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[13px] leading-[1.7]">
        {lines.map((line, i) => {
          const isPrompt = /^\s*[$#]/.test(line);
          const isEcho = /^\s*[├└│]?\s*[$#]/.test(line);
          return (
            <div
              key={i}
              className={
                line.includes("error[")
                  ? "text-[var(--bad)]"
                  : isPrompt
                    ? "text-[var(--ink)]"
                    : isEcho
                      ? "text-[var(--ink-subtle)]"
                      : "text-[var(--ink-muted)]"
              }
            >
              {line || "\u00a0"}
            </div>
          );
        })}
      </pre>
    </div>
  );
}
