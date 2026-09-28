/**
 * netlify.toml.
 *
 * This file is parsed by Netlify, on Netlify, after the repository has already
 * been pushed. Nothing local reads it, so a mistake in it survives every gate
 * here and fails as a deploy error with a line number pointing at a file nobody
 * was looking at.
 *
 * That is not hypothetical: the first version of this file used `\$` inside a
 * TOML basic string, which is not a valid escape, and it took a Netlify build
 * to find out. The parse is therefore checked here, and a machine without a TOML
 * parser skips rather than pretends.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const toml = readFileSync("netlify.toml", "utf8");

/** Is there a TOML parser available? Python 3.11+ has one in the standard library. */
function parser(): ((source: string) => Record<string, unknown>) | null {
  try {
    execFileSync("python3", ["-c", "import tomllib"], { stdio: "ignore" });
  } catch {
    return null;
  }
  return (source: string) => {
    const out = execFileSync(
      "python3",
      ["-c", "import json,sys,tomllib;print(json.dumps(tomllib.loads(sys.stdin.read())))"],
      { input: source, encoding: "utf8" },
    );
    return JSON.parse(out) as Record<string, unknown>;
  };
}

const parse = parser();
type HeaderBlock = { for: string; values: Record<string, string> };

const config = parse?.(toml) as
  | { build?: Record<string, unknown>; headers?: HeaderBlock[]; redirects?: unknown[] }
  | undefined;

describe.skipIf(!parse)("netlify.toml", () => {
  it("is valid TOML", () => {
    // The whole point. A file that only the deploy host parses gets no other
    // chance to be right.
    expect(config).toBeDefined();
  });

  it("builds the site with a compiler", () => {
    const build = config?.build as { command?: string; publish?: string };
    expect(build.publish).toBe(".next");
    // `build` runs the validator, which needs a compiler. If this line loses
    // the bootstrap, every deploy fails on a missing compiler — or worse, if it
    // also loses the validator, every deploy ships unchecked snippets.
    expect(build.command).toContain("ensure-compiler.sh");
    expect(build.command).toContain("npm run build");
  });

  it("pins the compiler revision to a tag, not a branch", () => {
    const env = (config?.build as { environment?: Record<string, string> }).environment ?? {};
    // A branch would validate the site's snippets against a moving target, and
    // the page that claims a version would be quietly wrong after a compiler
    // merge.
    expect(env.HARD_REF).toMatch(/^v\d+\.\d+/);
  });

  it("caches hashed assets forever and generated pages not at all", () => {
    // `[[headers]]` followed by `[headers.values]` parses to an array of
    // `{ for, values }` — the shape Netlify documents. Asserting it against a
    // guess is how this test found itself wrong rather than the file.
    const headers = config?.headers ?? [];
    const byPath = new Map(headers.map((h) => [h.for, h.values]));
    expect(byPath.get("/_next/static/*")?.["Cache-Control"]).toContain("immutable");
    // A generated page cached across a deploy serves yesterday's content, which
    // is a bug that looks like a CDN problem and is not.
    expect(byPath.get("/*")?.["Cache-Control"]).toContain("must-revalidate");
  });
});

describe("the file itself", () => {
  it("uses a literal string for the shell command", () => {
    // A basic string has no `\$` escape, and Netlify rejects the whole document
    // over it. Asserting the quoting keeps the next edit from reintroducing it.
    expect(toml).toMatch(/command\s*=\s*'/);
    expect(toml).not.toMatch(/command\s*=\s*"[^"]*\\\$/);
  });
});

describe("ensure-compiler.sh", () => {
  const script = readFileSync("scripts/ci/ensure-compiler.sh", "utf8");

  it("never prints a token", () => {
    // The build log is the worst possible place for a credential: it is
    // persisted, linkable, and often world-readable in a CI UI. The token goes
    // into a URL for git and nowhere else.
    expect(script).toContain('AUTH="x-access-token:');
    expect(script).not.toMatch(/echo\s+"?\$\{?GITHUB_TOKEN/);
    expect(script).not.toMatch(/echo\s+"?\$\{?GH_TOKEN/);
    expect(script).not.toMatch(/log\s+"?\$\{?GITHUB_TOKEN/);
    expect(script).toContain("GIT_TERMINAL_PROMPT=0");
  });

  it("pins a release tag by default, not a branch", () => {
    // Validating snippets against a moving branch means the site's claims
    // change without a deploy, and the compiler's default branch is `master`,
    // not `main`.
    expect(script).toMatch(/REF="\$\{HARD_REF:-v\d+\.\d+[^}]*\}"/);
    expect(script).toContain("--branch \"$REF\"");
  });

  it("makes cargo runnable on a host that ships rustup without a toolchain", () => {
    // Most CI images have rustup and no default toolchain, and cargo then
    // refuses to do anything: "rustup could not choose a version of cargo to
    // run". Probing cargo and pinning a named toolchain is what makes this work
    // on a host nobody configured.
    expect(script).toContain("ensure_rust()");
    expect(script).toMatch(/if cargo --version >\/dev\/null 2>&1; then\n    return 0/);
    expect(script).toContain("rustup toolchain install");
    expect(script).toContain('export RUSTUP_TOOLCHAIN="$toolchain"');
    // Probing first is the point: a developer machine with a working toolchain
    // must not download a second one.
    expect(script.indexOf("ensure_rust()")).toBeLessThan(script.indexOf("cargo build"));
  });

  it("keeps the expensive Rust state out of the discarded repo directory on CI", () => {
    // The build output, the crate downloads and the toolchain all cost minutes.
    // If they live in the repo directory, every deploy pays again.
    expect(script).toContain("/root/.cache/hardscript-target");
    expect(script).toContain("/root/.cache/cargo-home");
    expect(script).toContain("/root/.cache/rustup-home");
    // And only where it is safe: a developer with a warm ~/.cargo keeps it.
    expect(script).toMatch(/CARGO_HOME:-/);
  });

  it("explains the private-repository failure instead of leaving a git error", () => {
    // The failure this replaces was `fatal: could not read Username`, which
    // tells a build host operator nothing about what to do next.
    expect(script).toContain("is private, so an anonymous clone cannot work");
    expect(script).toContain("Set GITHUB_TOKEN in the build environment");
    expect(script).toContain("Or set HARD_BIN to a compiler you have already built");
  });

  it("treats a bad \\$HARD_BIN as an error rather than a fallback", () => {
    // Falling back would validate against a different compiler than the operator
    // asked for, and report success.
    expect(script).toMatch(/if \[ -n "\$\{HARD_BIN:-\}" \]; then\n  if usable/);
    expect(script).toContain('FATAL: \\$HARD_BIN is set to');
  });
});
