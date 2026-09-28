import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Learn HardScript from the language reference to a deployed API.",
  alternates: { canonical: "/docs" },
};

/** The first slice of the tree. The full tree arrives with the docs engine. */
const SECTIONS = [
  {
    title: "Introduction",
    href: "/docs/introduction",
    body: "What HardScript is, what it compiles to, and the shape of a program.",
    status: "next" as const,
  },
  {
    title: "Getting started",
    href: "/docs/getting-started",
    body: "Install, write one file, run it, and understand what the compiler did.",
    status: "next" as const,
  },
  {
    title: "Language reference",
    href: "/docs/language",
    body: "Variables, functions, control flow, errors, async, modules.",
    status: "planned" as const,
  },
  {
    title: "HTTP server",
    href: "/docs/http",
    body: "Routes, middleware, validation, cookies, streaming, WebSockets.",
    status: "planned" as const,
  },
  {
    title: "ORM",
    href: "/docs/orm",
    body: "Models, relationships, transactions, batches, migrations.",
    status: "planned" as const,
  },
];

export default function DocsIndex() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-[-0.02em]">Documentation</h1>
      <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
        The documentation is generated from the compiler and validated on every build, so
        a page cannot drift away from the language it describes.
      </p>

      <ul className="mt-10 space-y-3">
        {SECTIONS.map((s) => (
          <li key={s.href}>
            {s.status === "next" ? (
              <Link
                href={s.href}
                className="group flex items-start justify-between gap-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--accent)]/40"
              >
                <span>
                  <span className="flex items-center gap-2 text-[15px] font-semibold">
                    {s.title}
                    <Badge tone="accent">writing now</Badge>
                  </span>
                  <span className="mt-1.5 block text-sm text-[var(--ink-muted)]">{s.body}</span>
                </span>
                <ArrowRight className="mt-1 size-4 shrink-0 text-[var(--ink-subtle)] transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            ) : (
              <div className="flex items-start justify-between gap-4 rounded-xl border border-[var(--line)] p-5 opacity-70">
                <span>
                  <span className="flex items-center gap-2 text-[15px] font-semibold">
                    {s.title}
                    <Badge>planned</Badge>
                  </span>
                  <span className="mt-1.5 block text-sm text-[var(--ink-muted)]">{s.body}</span>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
