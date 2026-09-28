import type { Heading } from "@/lib/docs";

/** The table of contents for one page. Scrollspy lands in milestone 16. */
export function DocsToc({ headings }: { headings: Heading[] }) {
  const h2 = headings.filter((h) => h.level === 2);
  if (h2.length < 2) return null;
  return (
    <nav aria-label="On this page" className="text-[13px]">
      <p className="mb-2 font-medium tracking-tight text-[var(--ink)]">On this page</p>
      <ul className="space-y-1.5 border-l border-[var(--line)]">
        {h2.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className="-ml-px block border-l border-transparent pl-3 text-[var(--ink-subtle)] transition-colors hover:border-[var(--accent)] hover:text-[var(--ink)]"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
