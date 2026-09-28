import Link from "next/link";
import { footerNav, site, type NavItem } from "@/lib/site";
import { docSections } from "@/lib/docs";

/**
 * The documentation column, from the content tree.
 *
 * Generated rather than written, because a written list of documentation links
 * rots: it keeps pointing at pages that were renamed, never written, or
 * deleted, and nobody notices until a reader clicks one. This column cannot
 * disagree with the tree, because it is the tree.
 */
const documentationColumn: { title: string; items: NavItem[] } = {
  title: "Documentation",
  items: docSections().map((s) => ({
    title: s.index?.title ?? s.title,
    href: s.index?.slug ?? s.pages[0]?.slug ?? "/docs",
  })),
};

export function Footer() {
  const groups = [documentationColumn, ...footerNav];
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((group) => (
          <div key={group.title}>
            <h2 className="text-[13px] font-semibold tracking-tight">{group.title}</h2>
            <ul className="mt-3 space-y-2">
              {group.items.map((item) => (
                <li key={item.href}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-sm text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-sm text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
                    >
                      {item.title}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-[var(--line)] px-5 py-6 text-[13px] text-[var(--ink-subtle)] sm:flex-row sm:items-center sm:justify-between">
        <p>
          {site.name} is open source. Documentation {site.languageVersion}, docs for {site.version}.
        </p>
        <p>
          Built from the compiler. Every snippet on this site compiles —{" "}
          <Link href="/about" className="underline underline-offset-2">
            how we know
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
