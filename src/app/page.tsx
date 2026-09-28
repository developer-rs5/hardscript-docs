import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, Boxes, Database, Gauge, Layers, Package, Rocket, Terminal } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroCode } from "@/components/home/hero-code";
import { FeatureMarquee } from "@/components/home/feature-marquee";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  alternates: { canonical: "/" },
};

const INSTALL = "curl -fsSL https://hardscript.org/install.sh | sh";

export default function HomePage() {
  return (
    <>
      {/* ---------------------------------------------------------- hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-70 blur-[120px]"
          style={{ background: "radial-gradient(closest-side, var(--glow), transparent)" }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge tone="accent" className="mb-6">
              {site.languageVersion} · registry ecosystem shipped
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-[-0.03em] sm:text-6xl">
              Build backend APIs at native speed.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-[var(--ink-muted)] sm:text-lg">
              {site.description}
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href="/install" size="lg">
                Install
                <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/docs" variant="secondary" size="lg">
                <BookOpen className="size-4" aria-hidden />
                Documentation
              </ButtonLink>
              <ButtonLink href="/docs/introduction" variant="ghost" size="lg">
                Playground
              </ButtonLink>
              <ButtonLink href={site.repo} variant="ghost" size="lg" external>
                GitHub
              </ButtonLink>
            </div>

            <div className="mx-auto mt-8 flex max-w-xl items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-left">
              <Terminal className="size-4 shrink-0 text-[var(--ink-subtle)]" aria-hidden />
              <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-[var(--ink-muted)]">
                {INSTALL}
              </code>
            </div>
          </div>

          <div className="mx-auto mt-14 max-w-4xl">
            <HeroCode />
            <p className="mt-3 text-center text-[13px] text-[var(--ink-subtle)]">
              The snippet above is compiled by the real compiler on every build of this
              site. It is not illustrative pseudocode.
            </p>
          </div>
        </div>
      </section>

      <div className="rule" />

      {/* ------------------------------------------------------- features */}
      <FeatureMarquee />

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={Gauge}
            title="Compiled, not interpreted"
            body="HardScript is compiled to C++ and linked with a native HTTP server. A request is not a function call into a runtime; it is a route handler that the optimizer has already specialised."
            href="/runtime"
          />
          <Feature
            icon={Database}
            title="ORM in the language"
            body="Models are declared in source, not in an external schema file. Relationships, transactions, batches and migrations are part of the same program, and the generated SQL is readable."
            href="/docs/orm"
          />
          <Feature
            icon={Layers}
            title="One process, many workers"
            body="The worker pool, keep-alive connections and the memory arena are part of the runtime, not a deployment concern. Idle cost is measured, not guessed at."
            href="/runtime"
          />
          <Feature
            icon={Rocket}
            title="Deploy as a binary"
            body="One static binary, one Dockerfile, no runtime to install. The deployment guide covers Docker, systemd, Kubernetes and the managed platforms that host a binary well."
            href="/deploy"
          />
          <Feature
            icon={Package}
            title="A real registry"
            body="Publish, resolve, verify. Every version is signed with Ed25519 over the package digest and the manifest fingerprint, and mirrors are a configuration block rather than an outage."
            href="/registry"
          />
          <Feature
            icon={Boxes}
            title="Batteries, not ceremony"
            body="Authentication, cache, queue, scheduler, metrics and health checks are language constructs. You write the behaviour, not the wiring."
            href="/docs"
          />
        </div>
      </section>

      {/* -------------------------------------------------------- numbers */}
      <section className="border-y border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Numbers we are willing to defend
            </h2>
            <p className="mt-3 text-[var(--ink-muted)]">
              Every figure on this site is measured by a script in the repository, on the
              machine described alongside it, and regenerated on demand. When a number is
              not measured it is printed as not measured.
            </p>
          </div>
          <dl className="mt-10 grid gap-px overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Cold start" value="measured" href="/benchmark" />
            <Stat label="Requests per second" value="measured" href="/benchmark" />
            <Stat label="Idle memory" value="measured" href="/benchmark" />
            <Stat label="Incremental rebuild" value="measured" href="/runtime" />
          </dl>
          <p className="mt-4 text-[13px] text-[var(--ink-subtle)]">
            The benchmark dashboard is being filled in as each harness lands. Numbers appear
            there when they have been measured, not before.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------ cta */}
      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <h2 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
          Start with one file
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[var(--ink-muted)]">
          A HardScript program is one file. Bring a module, declare a route, run it.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/install" size="lg">
            Read the guide
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
          <ButtonLink href="/docs/errors" variant="secondary" size="lg">
            Error catalog
          </ButtonLink>
        </div>
        <p className="mt-6 text-[13px] text-[var(--ink-subtle)]">
          New here?{" "}
          <Link href="/docs/introduction" className="underline underline-offset-2">
            Start with the introduction
          </Link>
          , then build a server in five minutes.
        </p>
      </section>
    </>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
  href,
}: {
  icon: typeof Gauge;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--accent)]/40"
    >
      <span className="inline-flex size-9 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--canvas)] text-[var(--accent)]">
        <Icon className="size-4" aria-hidden />
      </span>
      <h3 className="mt-4 text-[15px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm text-[var(--ink-muted)]">{body}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-[var(--accent)]">
        Read more
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link href={href} className="bg-[var(--surface)] p-5 transition-colors hover:bg-[var(--surface-2)]">
      <dt className="text-[13px] text-[var(--ink-subtle)]">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tracking-tight">{value}</dd>
    </Link>
  );
}
