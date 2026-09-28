/**
 * The route table, derived.
 *
 * Kept separate from `docs.ts` so a request handler can pull the slugs without
 * dragging in the page-reading helpers, and so the rule for "what a route is"
 * exists in exactly one place.
 */

import { allPages, docSections } from "./docs";

/** Every route the content tree produces, `/docs` included. */
export function getAllDocSlugs(): string[] {
  const slugs = allPages().map((p) => p.slug);
  return ["/docs", ...slugs];
}

/**
 * Is this the index page of its section?
 *
 * A section index carries a masthead and a list of its pages, so it does not
 * repeat the title the h1 in the body would produce.
 */
export function isSectionIndex(slug: string): boolean {
  return docSections().some((s) => s.index?.slug === slug);
}

/** The next and previous page in reading order, for the pager. */
export { pager } from "./docs";
