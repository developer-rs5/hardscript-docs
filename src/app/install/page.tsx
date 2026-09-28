import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleDashed,
  Terminal as TerminalIcon,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Status } from "@/components/install/status";
import { getInstallMethods } from "@/lib/install";
import { PrerequisiteTable, UpdateTable, UninstallTable } from "@/components/install/tables";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Install HardScript",
  description:
    "Every way to install the HardScript toolchain — source build, Homebrew, Scoop, APT, Pacman, Nix, Docker, and offline — with the state of each and how to verify yours.",
  alternates: { canonical: "/install" },
};

/**
 * The installation page.
 *
 * Every method comes from one list in `src/lib/install.ts`, which carries the
 * verification status of each. A method that has never been executed on a
 * machine says so on the page, in the same place a working one says it works —
 * because an install page whose every option looks equally proven is a page
 * someone will pick the untested one from.
 */
export default function InstallPage() {
  const methods = getInstallMethods();
  const primary = methods.find((m) => m.status === "verified")!;

  return (
    <div className="mx-auto w-full max-w-[860px] px-5 py-14">
      <header className="mb-12">
        <p className="mb-3 font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--accent)]">
          Installation
        </p>
        <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.025em] sm:text-[42px]">
          Install HardScript
        </h1>
        <p className="mt-5 max-w-[62ch] text-[16.5px] leading-[1.7] text-[var(--ink-muted)]">
          The toolchain is one binary. It compiles to C++ and links with your
          system&rsquo;s compiler, so the one hard requirement is a C++23
          compiler — and <code className="font-mono text-[0.9em] text-[var(--ink)]">hard doctor</code>{" "}
          will tell you if it cannot find one.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <ButtonLink href={primary.anchor} size="lg">
            {primary.label}
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
          <ButtonLink href="/docs/getting-started" variant="secondary" size="lg">
            <BookOpen className="size-4" aria-hidden />
            Your first program
          </ButtonLink>
        </div>
      </header>

      <PrerequisiteTable />

      <h2
        id="methods"
        className="mt-14 scroll-mt-24 border-t border-[var(--line)] pt-7 text-[24px] font-semibold tracking-[-0.015em]"
      >
        Every method
      </h2>
      <p className="mt-3 text-[15.5px] leading-[1.75] text-[var(--ink-muted)]">
        Nine ways to get the binary, in the order worth trying. The status beside
        each one is not a marketing badge: it records whether the commands below
        have been run on a machine and what came back.
      </p>

      <div className="mt-6 space-y-3">
        {methods.map((m) => (
          <section
            key={m.id}
            id={m.anchor}
            className="scroll-mt-24 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--line)] px-5 py-3.5">
              <h3 className="text-[16.5px] font-medium tracking-[-0.01em]">{m.title}</h3>
              <Status status={m.status} verifiedOn={m.verifiedOn} />
            </div>
            <div className="px-5 py-4">
              <p className="text-[14.5px] leading-[1.7] text-[var(--ink-muted)]">{m.summary}</p>
              {m.requires.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {m.requires.map((r) => (
                    <li
                      key={r}
                      className="rounded border border-[var(--line)] px-2 py-0.5 font-mono text-[11.5px] text-[var(--ink-subtle)]"
                    >
                      {r}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-4 space-y-3">
                {m.steps.map((step) => (
                  <div key={step.label}>
                    <p className="mb-1.5 text-[13px] font-medium text-[var(--ink)]">{step.label}</p>
                    <pre className="not-prose overflow-x-auto rounded-lg border border-[var(--line)] bg-[var(--code-bg)] px-4 py-3 font-mono text-[13px] leading-[1.6]">
                      <code>{step.command}</code>
                    </pre>
                    {step.note ? (
                      <p className="mt-1.5 text-[13px] leading-[1.6] text-[var(--ink-subtle)]">
                        {step.note}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
              {m.status !== "verified" ? (
                <p className="mt-4 rounded-lg border border-[var(--warn)]/30 bg-[var(--warn)]/[0.07] px-3.5 py-2.5 text-[13.5px] leading-[1.65] text-[var(--ink-muted)]">
                  <span className="font-medium text-[var(--ink)]">What is missing: </span>
                  {m.blockedBy}
                </p>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      <h2
        id="offline"
        className="mt-14 scroll-mt-24 border-t border-[var(--line)] pt-7 text-[24px] font-semibold tracking-[-0.015em]"
      >
        Offline and air-gapped machines
      </h2>
      <p className="mt-3 text-[15.5px] leading-[1.75] text-[var(--ink-muted)]">
        A HardScript project carries its own runtime headers in{" "}
        <code className="font-mono text-[0.9em] text-[var(--ink)]">runtime/</code>, and the
        toolchain is a single static-ish binary, so building a project needs no
        network at all. Dependencies are the only thing that does, and those
        live in one shared cache you can warm elsewhere and copy in.
      </p>
      <pre className="not-prose mt-4 overflow-x-auto rounded-lg border border-[var(--line)] bg-[var(--code-bg)] px-4 py-3 font-mono text-[13px] leading-[1.6]">
        <code>{`# On a machine with network, for the same lockfile:
hard install
hard cache info

# Copy ~/.hard/cache to the air-gapped machine, then:
export HARD_HOME=/opt/hard
cp -r ~/.hard/cache /opt/hard/cache
hard install          # resolves from the lockfile against the cache
hard build            # no network`}</code>
      </pre>
      <p className="mt-3 text-[14px] leading-[1.7] text-[var(--ink-subtle)]">
        <TerminalIcon className="mr-1.5 inline size-3.5 align-[-2px]" aria-hidden />
        The cache is content-addressed and shared across projects, so one copy on a
        machine serves every project on it.{" "}
        <Link href="/docs/registry" className="underline underline-offset-2">
          The registry
        </Link>{" "}
        has the mirror configuration for pinning one.
      </p>

      <h2
        id="updating"
        className="mt-14 scroll-mt-24 border-t border-[var(--line)] pt-7 text-[24px] font-semibold tracking-[-0.015em]"
      >
        Updating
      </h2>
      <UpdateTable />

      <h2
        id="uninstalling"
        className="mt-14 scroll-mt-24 border-t border-[var(--line)] pt-7 text-[24px] font-semibold tracking-[-0.015em]"
      >
        Uninstalling
      </h2>
      <UninstallTable />

      <h2
        id="versions"
        className="mt-14 scroll-mt-24 border-t border-[var(--line)] pt-7 text-[24px] font-semibold tracking-[-0.015em]"
      >
        Version management
      </h2>
      <p className="mt-3 text-[15.5px] leading-[1.75] text-[var(--ink-muted)]">
        The toolchain has no version manager, and that is on purpose: it is one
        binary with no runtime of its own, so there is nothing to keep in step
        with a project. Where a project pins dependencies,{" "}
        <code className="font-mono text-[0.9em] text-[var(--ink)]">hard.lock</code> is the
        thing that makes a build reproducible.
      </p>
      <p className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[14px] leading-[1.7] text-[var(--ink-muted)]">
        <span className="font-medium text-[var(--ink)]">Two version numbers. </span>
        This site documents the language as{" "}
        <code className="font-mono text-[0.9em] text-[var(--ink)]">{site.languageVersion}</code>,
        while the binary prints its own crate version —{" "}
        <code className="font-mono text-[0.9em] text-[var(--ink)]">hard 0.5.0</code> at the
        time of writing. Quote both in a bug report:{" "}
        <code className="font-mono text-[0.9em] text-[var(--ink)]">hard --version</code> for
        the binary, and <code className="font-mono text-[0.9em] text-[var(--ink)]">hard doctor</code>{" "}
        for the runtime commit it links.
      </p>

      <h2
        id="troubleshooting"
        className="mt-14 scroll-mt-24 border-t border-[var(--line)] pt-7 text-[24px] font-semibold tracking-[-0.015em]"
      >
        Troubleshooting
      </h2>
      <div className="mt-4 space-y-3">
        {[
          {
            q: "`hard: command not found` after a source build",
            a: "cargo installs to ~/.cargo/bin. If that is not on your PATH, add it: `export PATH=\"$HOME/.cargo/bin:$PATH\"`.",
          },
          {
            q: "`g++: command not found` at build time",
            a: "The toolchain is installed; the C++ compiler is not. `hard doctor` prints the exact command it looked for. Install g++ 13+ or clang++ 17+.",
          },
          {
            q: "`hard doctor` reports a runtime that is embedded, and you expected a path",
            a: "That is the normal state. The runtime is compiled into the binary and written to the project's runtime/ directory by `hard new`.",
          },
          {
            q: "A build is slow the first time, instant afterwards",
            a: "That is the cache. The first build compiles every translation unit; later builds print `0 miss` and compile nothing. `hard cache clean` throws the cache away.",
          },
          {
            q: "`hard install` fails on a machine with no network",
            a: "It is reaching the registry. Warm the cache on a connected machine, copy ~/.hard/cache, and point HARD_HOME at it — see the offline section above.",
          },
          {
            q: "A port is already in use",
            a: "The number in `app @3000` is the port. Change it and call the new one; there is no environment override.",
          },
        ].map((row) => (
          <details
            key={row.q}
            className="group rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3"
          >
            <summary className="cursor-pointer list-none text-[14.5px] font-medium text-[var(--ink)]">
              <span className="flex items-start gap-2.5">
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-[var(--accent)]"
                  aria-hidden
                />
                {row.q}
              </span>
            </summary>
            <p className="mt-2 pl-6.5 text-[14px] leading-[1.7] text-[var(--ink-muted)]">
              {row.a}
            </p>
          </details>
        ))}
      </div>

      <h2
        id="next"
        className="mt-14 scroll-mt-24 border-t border-[var(--line)] pt-7 text-[24px] font-semibold tracking-[-0.015em]"
      >
        What next
      </h2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {[
          { href: "/docs/getting-started", title: "Getting started", body: "Write a route, run it, call it." },
          { href: "/docs/language/syntax", title: "Syntax", body: "The whole surface in one page." },
          { href: "/docs/tooling/cli", title: "CLI reference", body: "Every command the binary has." },
          { href: "/docs/limitations", title: "Known limitations", body: "What compiles today, and what does not." },
        ].map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="group block rounded-lg border border-[var(--line)] p-3.5 transition-colors hover:border-[var(--line-strong)]"
            >
              <span className="flex items-center gap-1.5 text-[14.5px] font-medium tracking-tight">
                {l.title}
                <ArrowRight
                  className="size-3.5 text-[var(--ink-subtle)] transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
              <span className="mt-1 block text-[13.5px] text-[var(--ink-muted)]">{l.body}</span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 flex items-center gap-2 text-[13px] text-[var(--ink-subtle)]">
        <CircleDashed className="size-3.5" aria-hidden />
        Methods marked as planned need a packaging artifact in the compiler
        repository before they can work. The list above is the specification for
        each of them.
      </p>
    </div>
  );
}
