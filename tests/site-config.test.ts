import { describe, expect, it } from "vitest";
import { nav, site, footerNav } from "@/lib/site";

/**
 * Navigation is the one thing every page depends on, and the failure mode is
 * silent: a link to a section that does not exist yet renders a 404 that looks
 * like a styling bug. So the rules are asserted here rather than trusted.
 */

const IMPLEMENTED = new Set(["/", "/docs", "/install"]);

describe("site config", () => {
  it("has the metadata every page renders", () => {
    expect(site.name).toBe("HardScript");
    expect(site.tagline.length).toBeGreaterThan(10);
    expect(site.description.length).toBeGreaterThan(50);
    expect(site.url).toMatch(/^https?:\/\//);
  });

  it("marks sections that do not exist yet", () => {
    for (const item of nav) {
      if (!IMPLEMENTED.has(item.href)) {
        expect(item.coming, `${item.href} is not implemented and must be marked coming`).toBe(true);
      }
    }
  });

  it("never marks an implemented section as coming", () => {
    for (const item of nav) {
      if (IMPLEMENTED.has(item.href)) {
        expect(item.coming, `${item.href} exists and must not be marked coming`).toBeFalsy();
      }
    }
  });
});

describe("footer navigation", () => {
  it("uses only absolute internal paths", () => {
    for (const group of footerNav) {
      for (const item of group.items) {
        expect(item.href.startsWith("/") || /^https:\/\//.test(item.href)).toBe(true);
        if (item.external) {
          expect(item.href).toMatch(/^https:\/\//);
        }
      }
    }
  });

  it("has no duplicate hrefs", () => {
    const hrefs = footerNav.flatMap((g) => g.items.map((i) => i.href));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
