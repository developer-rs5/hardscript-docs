import Link from "next/link";
import { AlertTriangle, ArrowUpRight } from "lucide-react";

/**
 * A Known Limitation, in four parts.
 *
 * Every one of these has the same shape, and a callout missing a part is a callout
 * that has told a reader half the story. So the parts are props: you cannot
 * write one without saying what compiles, what a reader would expect, why the
 * two differ, and where it is being fixed.
 *
 * ```mdx
 * <Limitation
 *   id="no-else"
 *   current="A `?` block, and falling through when it does not match."
 *   expected="`if` / `else` / `else if`."
 *   why="The parser has one conditional production: a test and a block."
 *   tracked="L-01. Conditional completeness, v0.10."
 * />
 * ```
 *
 * `id` is not decoration. The build checks that it matches an entry in the
 * limitations registry, so a callout cannot point at a gap nobody is tracking.
 */
export function Limitation({
  id,
  current,
  expected,
  why,
  tracked,
  version = "0.9-alpha",
}: {
  /** Matches an anchor in /docs/limitations. */
  id: string;
  current: string;
  expected: string;
  why: string;
  tracked: string;
  version?: string;
}) {
  return (
    <aside
      id={id}
      className="my-7 scroll-mt-24 overflow-hidden rounded-lg border border-[var(--warn)]/35 bg-[var(--warn)]/[0.07]"
    >
      <p className="flex items-center gap-2 border-b border-[var(--warn)]/25 bg-[var(--warn)]/10 px-4 py-2.5 text-[13px] font-semibold tracking-tight text-[var(--ink)]">
        <AlertTriangle className="size-4 text-[var(--warn)]" aria-hidden />
        Known limitation
        <span className="font-mono text-[11.5px] font-normal text-[var(--ink-subtle)]">
          v{version}
        </span>
        <Link
          href={`/docs/limitations#${id}`}
          className="ml-auto inline-flex items-center gap-1 text-[12px] font-normal text-[var(--ink-subtle)] transition-colors hover:text-[var(--ink)]"
        >
          {tracked.split(".")[0]}
          <ArrowUpRight className="size-3" aria-hidden />
        </Link>
      </p>
      <dl className="divide-y divide-[var(--warn)]/15 text-[14px] leading-[1.65]">
        <Row label="Compiles today">{current}</Row>
        <Row label="You would expect">{expected}</Row>
        <Row label="Why they differ">{why}</Row>
        <Row label="Tracked as">{tracked}</Row>
      </dl>
    </aside>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-x-4 gap-y-1 px-4 py-2.5 sm:grid-cols-[132px_1fr]">
      <dt className="text-[12px] font-medium uppercase tracking-[0.06em] text-[var(--ink-subtle)]">
        {label}
      </dt>
      <dd className="text-[var(--ink-muted)] [&>code]:rounded [&>code]:border [&>code]:border-[var(--line)] [&>code]:bg-[var(--code-bg)] [&>code]:px-1 [&>code]:py-0.5 [&>code]:font-mono [&>code]:text-[0.85em] [&>code]:text-[var(--ink)]">
        {children}
      </dd>
    </div>
  );
}
