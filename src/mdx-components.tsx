import type { MDXComponents } from "mdx/types";
// `CodeBlock` and `Terminal` are what the remark plugin emits for a fence, so
// they have to be in the map: MDX renders `<CodeBlock>` as JSX, and an
// unregistered name is a build error rather than a missing style.
import {
  Anchor,
  Callout,
  Card,
  CodeBlock,
  Grid,
  InlineCode,
  Limitation,
  Steps,
  Tab,
  Tabs,
  Terminal,
} from "./components/mdx";

/**
 * What a page may use without importing anything.
 *
 * MDX resolves these names, so a page that forgets an import renders an
 * "Expected component" error rather than silently dropping the content.
 */
export const mdxComponents: MDXComponents = {
  h1: (props) => <h1 {...props} className="mt-2 mb-5 text-[32px] font-semibold leading-tight tracking-[-0.02em] sm:text-[36px]" />,
  h2: (props) => {
    const id = textToId(String(props.children ?? ""));
    return (
      <h2 id={id} className="mt-14 scroll-mt-24 border-t border-[var(--line)] pt-7 text-[23px] font-semibold tracking-[-0.015em]">
        {props.children}
      </h2>
    );
  },
  h3: (props) => {
    const id = textToId(String(props.children ?? ""));
    return (
      <h3 id={id} className="mt-9 scroll-mt-24 text-[17px] font-semibold tracking-[-0.01em]">
        <a href={`#${id}`} className="group inline-flex items-baseline gap-1.5">
          {props.children}
          <span className="text-[var(--ink-subtle)] opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>
            #
          </span>
        </a>
      </h3>
    );
  },
  p: (props) => <p {...props} className="my-4 text-[15.5px] leading-[1.75] text-[var(--ink-muted)]" />,
  a: (props) => (
    <a
      {...props}
      className="font-medium text-[var(--accent)] underline decoration-[var(--accent)]/30 underline-offset-4 hover:decoration-[var(--accent)]"
    />
  ),
  ul: (props) => <ul {...props} className="my-4 space-y-2 pl-1 text-[15.5px] leading-[1.7] text-[var(--ink-muted)] [&>li]:relative [&>li]:pl-5 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:text-[var(--accent)] [&>li]:before:content-['—']" />,
  ol: (props) => <ol {...props} className="my-4 list-decimal space-y-2 pl-6 text-[15.5px] leading-[1.7] text-[var(--ink-muted)] marker:text-[var(--ink-subtle)]" />,
  blockquote: (props) => (
    <blockquote {...props} className="my-6 border-l-2 border-[var(--accent)] pl-4 text-[var(--ink-muted)] italic" />
  ),
  table: (props) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-[var(--line)]">
      <table {...props} className="w-full border-collapse text-[14px]" />
    </div>
  ),
  th: (props) => <th {...props} className="border-b border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-left text-[13px] font-medium" />,
  td: (props) => <td {...props} className="border-b border-[var(--line)] px-3.5 py-2.5 align-top text-[var(--ink-muted)] last:border-0" />,
  hr: (props) => <hr {...props} className="my-10 border-[var(--line)]" />,
  kbd: (props) => (
    <kbd {...props} className="rounded border border-[var(--line-strong)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[12px]" />
  ),
  pre: (props) => <pre {...props} className="overflow-x-auto" />,
  Callout,
  Card,
  CodeBlock,
  Grid,
  InlineCode,
  Limitation,
  Steps,
  Terminal,
  Step: Steps.Step,
  Tabs,
  Tab,
  Anchor,
};

function textToId(s: string): string {
  return s
    .replace(/[`*_]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { ...mdxComponents, ...components };
}
