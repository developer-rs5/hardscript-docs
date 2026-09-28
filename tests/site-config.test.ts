import { describe, expect, it } from "vitest";
import { nav, site, footerNav } from "@/lib/site";
import { allPages } from "@/lib/docs";

/**
 * Navigation is the one thing every page depends on, and the failure mode is
 * silent: a link to a section that does not exist yet renders a 404 that looks
 * like a styling bug. So the rules are asserted here rather than trusted.
 */

/**
 * Routes that exist because a file exists, not because a list says so.
 *
 * The two rules below exist to catch a link to a page that is not there. For a
 * documentation route the content tree is the truth, so a hand-written list
 * would only be a second thing to forget to update — and when it was wrong,
 * this file's own list was wrong at the same moment as the navigation.
 */
const APP_ROUTES = new Set(["/", "/docs", "/install"]);

function isImplemented(href: string): boolean {
  if (APP_ROUTES.has(href)) return true;
  if (!href.startsWith("/docs/")) return false;
  return allPages().some((p) => p.slug === href);
}

describe("site config", () => {
  it("has the metadata every page renders", () => {
    expect(site.name).toBe("HardScript");
    expect(site.tagline.length).toBeGreaterThan(10);
    expect(site.description.length).toBeGreaterThan(50);
    expect(site.url).toMatch(/^https?:\/\//);
  });

  it("marks sections that do not exist yet", () => {
    for (const item of nav) {
      if (!isImplemented(item.href)) {
        expect(item.coming, `${item.href} is not implemented and must be marked coming`).toBe(true);
      }
    }
  });

  it("never marks an implemented section as coming", () => {
    for (const item of nav) {
      if (isImplemented(item.href)) {
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

  it("links to no documentation page that the content tree does not have", () => {
    // The documentation column is generated, so this holds by construction. The
    // other columns are hand-written, and this is the test that stops one of
    // them from pointing at a page that was renamed or never written.
    const pages = new Set(allPages().map((p) => p.slug));
    for (const group of footerNav) {
      for (const item of group.items) {
        if (!item.href.startsWith("/docs/")) continue;
        expect(pages.has(item.href), `footer links to ${item.href}, which no page provides`).toBe(
          true,
        );
      }
    }
  });
});
