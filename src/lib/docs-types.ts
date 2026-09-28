/**
 * The shape the navigation needs, with no file system in it.
 *
 * The sidebar is a client component, and a client component that imports a
 * module which reads files will drag `node:fs` into the browser bundle. The
 * server reads the tree and passes this instead: plain data, no functions, no
 * promises, nothing that cannot cross the boundary.
 */

export type PageSummary = {
  slug: string;
  title: string;
  description: string;
};

export type SectionSummary = {
  title: string;
  slug: string;
  blurb: string;
  /** The section's own page, when it wrote one. */
  index?: PageSummary;
  pages: PageSummary[];
};
