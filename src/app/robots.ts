import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * robots.txt, as a route.
 *
 * This used to live in `public/robots.ts`, which is the wrong place: files in
 * `public/` are copied verbatim, so the file was published at `/robots.ts` —
 * TypeScript source, served to anyone who asked — and `/robots.txt` itself
 * 404'd. A metadata route is compiled, so the URL is the URL.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
