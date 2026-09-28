import type { MetadataRoute } from "next";
import { allPages, docSections } from "@/lib/docs";
import { site } from "@/lib/site";

/**
 * The sitemap, generated from the content tree.
 *
 * A hand-maintained sitemap is a sitemap that lists 40 of the 250 pages, and
 * nothing reports the difference. This one cannot fall behind: a page exists
 * because a file exists, and so does its entry.
 *
 * The reading order is the sidebar's, not alphabetical, because that is the
 * order a crawler should weight pages in.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const reading = docSections().flatMap((s) => [...(s.index ? [s.index] : []), ...s.pages]);
  const docs = reading.map((page, i) => ({
    url: `${site.url}${page.slug}`,
    changeFrequency: "weekly" as const,
    // Shallower pages first, so a crawler spends its budget on the index and the
    // section pages before the leaves.
    priority: i < 8 ? 0.9 : 0.7,
  }));
  const rest: MetadataRoute.Sitemap = [
    { url: site.url, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/docs`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${site.url}/install`, changeFrequency: "monthly", priority: 0.8 },
  ];
  return [...rest, ...docs];
}
