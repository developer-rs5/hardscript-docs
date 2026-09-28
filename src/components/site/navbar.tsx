"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Code2, Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/** The routes that exist today. Everything else arrives with its milestone. */
const LINKS = [
  { title: "Docs", href: "/docs" },
  // Not /install yet: that page is milestone 3. The getting-started page opens
  // with installing the toolchain, so the button leads somewhere real.
  { title: "Install", href: "/docs/getting-started" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-5">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Logo />
          <span>{site.name}</span>
          <span className="hidden rounded-full border border-[var(--line)] px-1.5 py-px text-[10px] font-medium text-[var(--ink-subtle)] sm:inline">
            {site.languageVersion}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-sm transition-colors",
                isActive(l.href)
                  ? "text-[var(--ink)]"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
              )}
              aria-current={isActive(l.href) ? "page" : undefined}
            >
              {l.title}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <a
            href={site.repo}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="HardScript source on GitHub"
            className="hidden size-8 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)] sm:inline-flex"
          >
            <Code2 className="size-4" aria-hidden />
          </a>
          <ThemeToggle />
          <Link
            href="/docs/getting-started"
            className="hidden h-8 items-center rounded-lg bg-[var(--accent)] px-3 text-[13px] font-medium text-white sm:inline-flex"
          >
            Install
          </Link>
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-lg border border-[var(--line)] md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-[var(--line)] bg-[var(--canvas)] px-5 py-3 md:hidden" aria-label="Mobile">
          <ul className="space-y-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-2 py-2 text-sm text-[var(--ink-muted)]"
                >
                  {l.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

function Logo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden className="text-[var(--accent)]">
      <rect x="1.5" y="1.5" width="17" height="17" rx="4" fill="currentColor" opacity="0.14" />
      <path
        d="M6 6.5v7M6 10h4.5M10.5 6.5v7M13.5 8v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
