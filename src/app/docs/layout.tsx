import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DocsSidebar } from "@/components/docs/sidebar";
import { docSections } from "@/lib/docs";
import type { SectionSummary } from "@/lib/docs-types";

/**
 * The documentation frame: a search field, the tree, and the page.
 *
 * The frame is a layout so that moving between pages does not re-render it,
 * and the search field is a button until the search index exists — a text input
 * that does not search is worse than an honest "search" that says it is coming.
 */
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  // Read on the server, pass plain data down: the sidebar is a client
  // component and must not import anything that touches the file system.
  const sections: SectionSummary[] = docSections().map((s) => ({
    title: s.title,
    slug: s.slug,
    blurb: s.blurb,
    index: s.index
      ? { slug: s.index.slug, title: s.index.title, description: s.index.description }
      : undefined,
    pages: s.pages.map((p) => ({ slug: p.slug, title: p.title, description: p.description })),
  }));
  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-[68px] max-h-[calc(100vh-80px)] overflow-y-auto py-10 pr-2">
            <Link
              href="/docs"
              className="mb-5 inline-flex items-center gap-1.5 text-[12.5px] text-[var(--ink-subtle)] transition-colors hover:text-[var(--ink)]"
            >
              <ArrowLeft className="size-3" aria-hidden /> All sections
            </Link>
            <DocsSidebar sections={sections} />
            <p className="mt-8 border-t border-[var(--line)] pt-4 text-[12px] leading-[1.6] text-[var(--ink-subtle)]">
              {sections.reduce((n, s) => n + s.pages.length + (s.index ? 1 : 0), 0)} pages
              {" · "}
              validated against {process.env.NEXT_PUBLIC_HARD_VERSION ?? "0.9-alpha"}
            </p>
          </div>
        </aside>
        <div className="min-w-0 py-10">{children}</div>
      </div>
    </div>
  );
}
