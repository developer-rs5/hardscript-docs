import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

/** An anchor for a heading the author named explicitly: `<Anchor id="x">`. */
export function Anchor({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-14 scroll-mt-24 border-t border-[var(--line)] pt-7 text-[23px] font-semibold tracking-[-0.015em]">
      {children}
      <a href={`#${id}`} className="ml-2 text-[var(--ink-subtle)] opacity-0 transition-opacity hover:opacity-100 [h2:hover_&]:opacity-100" aria-hidden>
        #
      </a>
    </h2>
  );
}

/** A card that links somewhere, for a section index. */
export function Card({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  const external = href.startsWith("http");
  const body = (
    <>
      <span className="flex items-center gap-2 text-[15px] font-medium tracking-tight">
        {Icon ? <Icon className="size-4 text-[var(--accent)]" aria-hidden /> : null}
        {title}
        <ArrowUpRight className="size-3.5 text-[var(--ink-subtle)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
      </span>
      <span className="mt-1.5 block text-[14px] leading-[1.6] text-[var(--ink-muted)]">{description}</span>
    </>
  );
  const cls =
    "group flex flex-col rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--line-strong)]";
  return external ? (
    <a href={href} className={cls} rel="noreferrer">
      {body}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {body}
    </Link>
  );
}

/** A responsive grid of cards. */
export function Grid({ cols = 2, children }: { cols?: 1 | 2 | 3; children: React.ReactNode }) {
  const c = cols === 1 ? "" : cols === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2";
  return <div className={`my-6 grid gap-3 ${c}`}>{children}</div>;
}

/** Numbered steps, for a task a reader performs. */
export function Steps({ children }: { children: React.ReactNode }) {
  return (
    <ol className="[&>li]:relative [&>li]:grid [&>li]:grid-cols-[auto_1fr] [&>li]:gap-x-4 [&>li]:py-2 [&>li_p]:my-2 [&>li_p:first-child]:mt-0">
      {children}
    </ol>
  );
}

Steps.Step = function Step({ children }: { children: React.ReactNode }) {
  return (
    <li>
      <span
        aria-hidden
        className="mt-1.5 flex size-6 items-center justify-center rounded-full border border-[var(--line-strong)] font-mono text-[11px] text-[var(--ink-subtle)] [counter-increment:step] before:content-[counter(step)]"
      />
      <div className="text-[15.5px] leading-[1.75] text-[var(--ink-muted)]">{children}</div>
    </li>
  );
};

/** Tabs, for showing the same idea in two forms. */
export function Tabs({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 flex flex-col gap-2 [&>[data-tab]]:rounded-lg [&>[data-tab]]:border [&>[data-tab]]:border-[var(--line)] [&>[data-tab]]:p-3.5">
      {children}
    </div>
  );
}

export function Tab({
  label,
  children,
  defaultOpen = false,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details data-tab open={defaultOpen}>
      <summary className="cursor-pointer list-none font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--ink-subtle)] hover:text-[var(--ink)]">
        {label}
      </summary>
      <div className="mt-3 [&>*:first-child]:mt-0">{children}</div>
    </details>
  );
}
