import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { pager } from "@/lib/docs";

/** Previous and next, in the reading order the sidebar shows. */
export function DocsPager({ slug }: { slug: string }) {
  const { prev, next } = pager(slug);
  if (!prev && !next) return null;
  return (
    <nav aria-label="Page navigation" className="mt-14 grid gap-3 border-t border-[var(--line)] pt-6 sm:grid-cols-2">
      {prev ? (
        <Link
          href={prev.slug}
          className="group rounded-lg border border-[var(--line)] px-4 py-3 transition-colors hover:border-[var(--line-strong)]"
        >
          <span className="flex items-center gap-1.5 text-[12px] text-[var(--ink-subtle)]">
            <ArrowLeft className="size-3" aria-hidden /> Previous
          </span>
          <span className="mt-0.5 block text-[14px] font-medium tracking-tight">
            {prev.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={next.slug}
          className="group rounded-lg border border-[var(--line)] px-4 py-3 text-right transition-colors hover:border-[var(--line-strong)] sm:col-start-2"
        >
          <span className="flex items-center justify-end gap-1.5 text-[12px] text-[var(--ink-subtle)]">
            Next <ArrowRight className="size-3" aria-hidden />
          </span>
          <span className="mt-0.5 block text-[14px] font-medium tracking-tight">
            {next.title}
          </span>
        </Link>
      ) : null}
    </nav>
  );
}
