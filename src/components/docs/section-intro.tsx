import type { DocPage } from "@/lib/docs";

/** The masthead of a section index. */
export function SectionIntro({ page }: { page: DocPage }) {
  return (
    <header className="mb-10 border-b border-[var(--line)] pb-8">
      <p className="mb-3 font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--accent)]">
        {page.section}
      </p>
      <h1 className="text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[40px]">
        {page.title}
      </h1>
      <p className="mt-4 max-w-[62ch] text-[16px] leading-[1.65] text-[var(--ink-muted)]">
        {page.description}
      </p>
    </header>
  );
}
