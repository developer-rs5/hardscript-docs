import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen } from "lucide-react";
import { docSections } from "@/lib/docs";

export const metadata: Metadata = {
  title: "Documentation — HardScript",
  description:
    "The HardScript documentation: language, HTTP, ORM, runtime, tooling, the registry, and every compiler diagnostic.",
  alternates: { canonical: "/docs" },
};

/**
 * The documentation index.
 *
 * Generated from the content tree rather than written by hand, so a page that
 * is added shows up here and a page that is deleted disappears. The count is
 * the real one, and it moves when the tree does.
 */
export default function DocsIndex() {
  const sections = docSections();
  const pages = sections.reduce((n, s) => n + s.pages.length + (s.index ? 1 : 0), 0);
  return (
    <div className="mx-auto w-full max-w-[1000px] py-12">
      <header className="mb-12">
        <p className="mb-3 font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--accent)]">
          Documentation
        </p>
        <h1 className="text-[36px] font-semibold leading-[1.1] tracking-[-0.025em] sm:text-[44px]">
          HardScript, documented
        </h1>
        <p className="mt-5 max-w-[60ch] text-[16.5px] leading-[1.7] text-[var(--ink-muted)]">
          {pages} pages, and every HardScript snippet on this site is compiled by the
          real compiler when the site builds. Where the compiler and the language
          disagree, the page says so.
        </p>
      </header>

      <ul className="space-y-2">
        {sections.map((s) => {
          const count = s.pages.length + (s.index ? 1 : 0);
          return (
            <li key={s.slug}>
              <Link
                href={s.index?.slug ?? s.pages[0]?.slug ?? "/docs"}
                className="group grid gap-1.5 rounded-xl border border-[var(--line)] p-5 transition-colors hover:border-[var(--line-strong)] sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6"
              >
                <span>
                  <span className="flex items-center gap-2 text-[17px] font-medium tracking-[-0.01em]">
                    <BookOpen className="size-4 text-[var(--accent)]" aria-hidden />
                    {s.index?.title ?? s.title}
                  </span>
                  <span className="mt-1.5 block text-[14.5px] leading-[1.6] text-[var(--ink-muted)]">
                    {s.blurb}
                  </span>
                </span>
                <span className="flex items-center gap-3 sm:justify-end">
                  <span className="font-mono text-[12px] text-[var(--ink-subtle)]">
                    {count} {count === 1 ? "page" : "pages"}
                  </span>
                  <ArrowRight
                    className="size-4 text-[var(--ink-subtle)] transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
