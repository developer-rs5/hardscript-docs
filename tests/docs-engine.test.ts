/**
 * The content engine's invariants.
 *
 * These are the rules that, once broken, make the docs quietly wrong: a page
 * that is not in the sidebar, a slug that does not match its file, a fence the
 * build does not recognise. Each one has cost a documentation site something,
 * so each one is a test.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { allPages, docSections, pageBySlug, pager, tableOfContents, headingId } from "@/lib/docs";
import { fences, isProgram, isValidated } from "@/lib/fence-parsing";
import { SECTIONS, TEMPLATE_SECTIONS } from "@/lib/content-contract";

describe("the content tree", () => {
  it("has pages", () => {
    expect(allPages().length).toBeGreaterThan(0);
  });

  it("gives every page a unique slug", () => {
    const slugs = allPages().map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("derives the slug from the path, without an /index segment", () => {
    // content/docs/language/index.mdx is /docs/language, not
    // /docs/language/index: a URL that repeats the file's name is a URL nobody
    // types.
    const language = pageBySlug("/docs/language");
    expect(language).toBeDefined();
    expect(language?.section).toBe("Language");
    expect(pageBySlug("/docs/language/index")).toBeUndefined();
  });

  it("sorts pages within a section by their order field", () => {
    for (const s of docSections()) {
      const orders = s.pages.map((p) => p.order);
      expect(orders).toEqual([...orders].sort((a, b) => a - b));
    }
  });

  it("gives every page a section, and every section a page", () => {
    const known = new Set(SECTIONS.map((s) => s.title));
    for (const p of allPages()) expect(known.has(p.section)).toBe(true);
    for (const s of SECTIONS) {
      // Every declared section has at least an index or a page, so the sidebar
      // never shows a heading with nothing under it.
      const inSection = allPages().filter((p) => p.section === s.title);
      expect(inSection.length).toBeGreaterThan(0);
    }
  });

  it("keeps every page reachable from the sidebar", () => {
    const listed = docSections().flatMap((s) => [...(s.index ? [s.index] : []), ...s.pages]);
    expect(listed.length).toBe(allPages().length);
  });

  it("pages forward and back in reading order, and does not wrap", () => {
    // Reading order is the sidebar's order, which is not alphabetical: the
    // pages array is sorted by slug for the routes, and the pager follows the
    // order a reader actually walks.
    const reading = docSections().flatMap((s) => [...(s.index ? [s.index] : []), ...s.pages]);
    expect(pager(reading[0].slug).prev).toBeUndefined();
    expect(pager(reading.at(-1)!.slug).next).toBeUndefined();
    expect(pager(reading[1].slug).prev?.slug).toBe(reading[0].slug);
    expect(pager(reading[0].slug).next?.slug).toBe(reading[1].slug);
  });
});

/** Every heading in a page, at any level, lowercased. */
function headingsOf(body: string): Set<string> {
  const titles = new Set<string>();
  let inFence = false;
  for (const raw of body.split(/\r?\n/)) {
    if (/^```/.test(raw)) inFence = !inFence;
    if (inFence) continue;
    const m = /^(#{1,4})\s+(.*)$/.exec(raw);
    if (m) titles.add(m[2].replace(/[*`]/g, "").trim().toLowerCase());
  }
  return titles;
}

describe("frontmatter templates", () => {
  it("only uses templates the contract knows", () => {
    for (const p of allPages()) {
      expect(p.template in TEMPLATE_SECTIONS).toBe(true);
    }
  });

  it("gives every page the sections its template owes", () => {
    // The same check the build makes, asserted in a place that fails with the
    // page's name in the message rather than in a wall of report.
    for (const p of allPages()) {
      const titles = headingsOf(readFileSync(p.file, "utf8"));
      for (const section of TEMPLATE_SECTIONS[p.template]) {
        expect(
          titles.has(section.toLowerCase()),
          `${p.slug} is missing the section "${section}" that template "${p.template}" requires`,
        ).toBe(true);
      }
    }
  });
});

describe("fence parsing", () => {
  it("splits a language from its metadata", () => {
    const found = fences("```hard title=main.hard\napp @8080\n```");
    expect(found).toHaveLength(1);
    expect(found[0].lang).toBe("hard");
    expect(found[0].meta).toBe("title=main.hard");
    expect(found[0].code).toBe("app @8080");
  });

  it("reads a fence with no language as prose-as-code", () => {
    const found = fences("```\nplain\n```");
    expect(found[0].lang).toBe("");
    expect(isValidated(found[0])).toBe(false);
  });

  it("does not read a fence inside another fence", () => {
    const found = fences("```hard\napp @8080\n```\n\n```hard\napp @9090\n```");
    expect(found).toHaveLength(2);
    expect(found[1].code).toBe("app @9090");
  });

  it("compiles only whole programs, and never a fragment", () => {
    // The distinction decides whether a snippet is checked. Getting it wrong in
    // either direction is a hole in the guarantee: too strict and real programs
    // go unchecked, too loose and fragments are reported as broken.
    expect(isProgram("bring http\napp @8080\nGET \"/\" :: { <- {} }")).toBe(true);
    expect(isProgram("GET \"/\" :: { <- {} }")).toBe(false);
    expect(isProgram("app @8080\n...\n")).toBe(false);
    expect(isProgram("app @8080\n# a note\n")).toBe(false);
  });

  it("counts a fence as HardScript in any of its spellings", () => {
    for (const lang of ["hard", "hardscript", "hs"]) {
      expect(isValidated({ lang, meta: "", code: "", start: 0, end: 0 })).toBe(true);
    }
    expect(isValidated({ lang: "json", meta: "", code: "", start: 0, end: 0 })).toBe(false);
  });
});

describe("headings", () => {
  it("anchors the way a link to them would", () => {
    expect(headingId("Best practices")).toBe("best-practices");
    expect(headingId("`calc` and `async calc`")).toBe("calc-and-async-calc");
    expect(headingId("HS0001 — Unexpected token")).toBe("hs0001-unexpected-token");
  });

  it("collects H2 and H3 from a body, and ignores fenced headings", () => {
    const body = "## One\n\n```hard\n## not a heading\n```\n\n### Two\n";
    expect(tableOfContents(body).map((h) => h.text)).toEqual(["One", "Two"]);
  });
});

describe("the sitemap", () => {
  it("lists every documentation page exactly once", async () => {
    // A hand-written sitemap lists 40 of 250 pages and nothing reports it.
    // This one is generated, and the test says so: one entry per page, no
    // duplicates, and no page missing.
    const { default: sitemap } = await import("@/app/sitemap");
    const entries = sitemap();
    const locs = entries.map((e) => e.url.replace("https://hardscript.netlify.app", ""));
    const pages = allPages().map((p) => p.slug);
    for (const slug of pages) {
      expect(locs, `sitemap is missing ${slug}`).toContain(slug);
    }
    const docEntries = locs.filter((l) => l.startsWith("/docs/"));
    expect(new Set(docEntries).size).toBe(docEntries.length);
    expect(docEntries.length).toBe(pages.length);
  });

  it("puts the home page and the docs index before the leaves", async () => {
    const { default: sitemap } = await import("@/app/sitemap");
    const { site } = await import("@/lib/site");
    const entries = sitemap();
    expect(entries[0].url).toBe(site.url);
    expect(entries[0].priority).toBe(1);
    expect(entries[1].url).toBe(`${site.url}/docs`);
  });

  it("builds every URL from the configured origin", async () => {
    // A sitemap that mixes two origins is the quietest SEO bug there is: it
    // looks fine, ranks like nothing, and no build step complains.
    const { default: sitemap } = await import("@/app/sitemap");
    const { site } = await import("@/lib/site");
    for (const e of sitemap()) {
      expect(e.url.startsWith(site.url), `${e.url} is not on ${site.url}`).toBe(true);
    }
  });
});
