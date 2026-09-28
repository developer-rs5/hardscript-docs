"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SectionSummary } from "@/lib/docs-types";

/**
 * The sidebar, from data the server already read.
 *
 * The tree is passed in rather than read here: this is a client component, and
 * reading the content tree would mean bundling a file system into the browser.
 * The current section is the only one left open, so a reader in the ORM is not
 * scrolling past the language reference to find the next ORM page.
 */
export function DocsSidebar({ sections }: { sections: SectionSummary[] }) {
  // The layout renders this on every page and does not know the path; the
  // browser does. Reading it here keeps the frame from re-rendering per page.
  const slug = usePathname() ?? "";
  const current = sections.find(
    (s) => s.index?.slug === slug || s.pages.some((p) => p.slug === slug),
  );
  return (
    <nav aria-label="Documentation" className="text-[13.5px]">
      <ul className="space-y-5">
        {sections.map((s) => {
          const open = current?.slug === s.slug;
          return (
            <li key={s.slug}>
              {s.index ? (
                <Link
                  href={s.index.slug}
                  className={`font-medium tracking-tight ${
                    slug === s.index.slug
                      ? "text-[var(--ink)]"
                      : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {s.index.title || s.title}
                </Link>
              ) : (
                <span className="font-medium tracking-tight text-[var(--ink-muted)]">
                  {s.title}
                </span>
              )}
              {open && s.pages.length > 0 ? (
                <ul className="mt-1.5 space-y-0.5 border-l border-[var(--line)] pl-3">
                  {s.pages.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={p.slug}
                        aria-current={p.slug === slug ? "page" : undefined}
                        className={`block rounded py-0.5 transition-colors ${
                          p.slug === slug
                            ? "text-[var(--accent)]"
                            : "text-[var(--ink-subtle)] hover:text-[var(--ink)]"
                        }`}
                      >
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
