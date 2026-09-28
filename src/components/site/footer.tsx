import Link from "next/link";
import { footerNav, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {footerNav.map((group) => (
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
