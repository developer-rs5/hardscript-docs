/**
 * The install page.
 *
 * This page has one job that no other page has: every command on it gets typed
 * onto a machine that matters. So the tests here are about the claims, not the
 * layout.
 */

import { describe, expect, it } from "vitest";
import { getInstallMethods, installMethods, type InstallMethod } from "@/lib/install";

const methods = getInstallMethods();

describe("install methods", () => {
  it("lists the nine methods the roadmap asks for", () => {
    // A missing method is a reader who does not have a path, so the list is
    // asserted rather than trusted.
    const ids = methods.map((m) => m.id);
    for (const id of [
      "source",
      "prebuilt",
      "brew",
      "scoop",
      "apt",
      "pacman",
      "nix",
      "docker",
      "windows",
    ]) {
      expect(ids, `install page is missing the ${id} method`).toContain(id);
    }
  });

  it("gives every method at least one copy-pasteable command", () => {
    for (const m of methods) {
      expect(m.steps.length, `${m.id} has no steps`).toBeGreaterThan(0);
      for (const step of m.steps) {
        expect(step.command.trim().length).toBeGreaterThan(0);
        expect(step.label.trim().length).toBeGreaterThan(0);
        // A command with a placeholder in a URL is fine; a command that is
        // only prose is not a command.
        expect(step.command).toMatch(/\S/);
      }
    }
  });

  it("marks a method verified only when it says where it was verified", () => {
    // "Verified" is a claim about a machine, not an intention. A method cannot
    // claim it without naming the machine, which is what makes the claim
    // checkable by whoever reads it next.
    for (const m of methods) {
      if (m.status === "verified") {
        expect(m.verifiedOn, `${m.id} claims to be verified but names no machine`).toBeTruthy();
      }
    }
  });

  it("says what is missing for every method that does not work yet", () => {
    for (const m of methods) {
      if (m.status === "verified") continue;
      expect(
        m.blockedBy,
        `${m.id} is planned but does not say which artifact is missing`,
      ).toBeTruthy();
      expect((m.blockedBy ?? "").length).toBeGreaterThan(40);
    }
  });

  it("points the primary button at the method that works", () => {
    const verified = methods.filter((m) => m.status === "verified");
    expect(verified.length).toBeGreaterThan(0);
    // The page's hero button is `{primary.anchor}`, so the first verified method
    // is the one a reader lands on.
    expect(methods[0].status).toBe("verified");
  });

  it("shows no download URL for an artifact that does not exist", () => {
    // A planned method shows the command a reader would run once the packaging
    // lands. The one thing it must never do is hand over a download URL that
    // looks real and 404s — a reader cannot tell that apart from a broken
    // install, and it is the fastest way to lose their trust in the page.
    //
    // Hosts the project's own artifacts would live on are allowed: a Scoop
    // bucket and a Nix flake genuinely belong in this repository, and those
    // commands are labelled with the artifact they need. A release *asset* URL
    // is not, because the asset names are a convention nobody has implemented
    // yet, and a 404 there reads as a broken install rather than a missing one.
    for (const m of methods.filter((x) => x.status === "planned")) {
      const commands = m.steps.map((s) => s.command).join("\n");
      expect(
        /\/releases\/|\/download\//.test(commands) && !commands.includes("example.invalid"),
        `${m.id} shows a release download URL for an artifact that does not exist`,
      ).toBe(false);
      for (const host of commands.match(/https?:\/\/[^\s/]+/g) ?? []) {
        expect(
          [
            "https://example.invalid",
            "https://github.com",
            "https://ghcr.io",
            "https://aur.archlinux.org",
          ],
          `${m.id} links to an unverified host: ${host}`,
        ).toContain(host);
      }
    }
  });

  it("uses the repository's real remote and package path in the source build", () => {
    const source = methods.find((m) => m.id === "source") as InstallMethod;
    const text = source.steps.map((s) => s.command).join("\n");
    // The clone URL and the --path argument are the two facts a reader copies
    // most often, and both were wrong on the getting-started page until this
    // page was written.
    expect(text).toContain("https://github.com/developer-rs5/hardscript-1.git");
    expect(text).toContain("cargo install --path cli --locked");
  });

  it("keeps the object it returns stable between calls", () => {
    // The page calls this at build time. A fresh array each call would be fine
    // functionally and would make the "primary" method depend on nothing.
    expect(methods).toBe(installMethods);
  });
});
