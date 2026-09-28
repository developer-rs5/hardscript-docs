/** Everything about the site that appears in more than one place. */

export const site = {
  name: "HardScript",
  tagline: "Build backend APIs at native speed.",
  description:
    "HardScript is a compiled backend language with a built-in ORM, authentication, cache, queue, scheduler, deployment, package manager, registry and Docker support.",
  /**
   * The canonical origin, used for metadataBase, canonical tags, the sitemap
   * and robots.txt. A placeholder here does not fail loudly: the build succeeds
   * and every canonical URL points at a domain that does not resolve, which is
   * the kind of mistake that only shows up in a search result months later.
   *
   * Override it with NEXT_PUBLIC_SITE_URL when the domain changes, and the
   * sitemap follows without a code change.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://hardscript.netlify.app",
  // Both repositories were verified to exist before being written here. A
  // footer link to a repository that does not exist is worse than no link, and
  // it is invisible until a reader clicks it.
  repo: "https://github.com/developer-rs5/hardscript-1",
  docsRepo: "https://github.com/developer-rs5/hardscript-docs",
  version: "1.0-beta",
  languageVersion: "0.9-alpha",
  install: "curl -fsSL https://hardscript.org/install.sh | sh",
} as const;

export type NavItem = {
  title: string;
  href: string;
  description?: string;
  external?: boolean;
};

/** The primary navigation. Sections that exist as routes are links; the rest
 *  are marked `coming` until their milestone lands, rather than linking to a
 *  404. */
export type NavEntry = NavItem & { coming?: boolean };

export const nav: NavEntry[] = [
  { title: "Docs", href: "/docs" },
  { title: "Install", href: "/install" },
  { title: "Learn", href: "/learn", coming: true },
  { title: "Playground", href: "/playground", coming: true },
  { title: "Examples", href: "/examples", coming: true },
  { title: "Packages", href: "/packages", coming: true },
  { title: "Benchmark", href: "/benchmark", coming: true },
  { title: "Deploy", href: "/deploy", coming: true },
  { title: "Registry", href: "/registry", coming: true },
  { title: "CLI", href: "/cli", coming: true },
  { title: "ORM", href: "/orm", coming: true },
  { title: "Runtime", href: "/runtime", coming: true },
  { title: "API", href: "/api-reference", coming: true },
  { title: "Blog", href: "/blog", coming: true },
  { title: "Changelog", href: "/changelog", coming: true },
  { title: "Community", href: "/community", coming: true },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  // The documentation column is generated from the content tree, in
  // `src/components/site/footer.tsx`. A hand-written list of documentation
  // links is a list that rots: it keeps pointing at pages that were renamed,
  // never written, or deleted, and nobody notices until a reader clicks one.
  {
    title: "Reference",
    items: [
      { title: "CLI reference", href: "/cli" },
      { title: "API reference", href: "/api-reference" },
      { title: "Error catalog", href: "/docs/errors/catalog" },
      { title: "Runtime internals", href: "/runtime" },
    ],
  },
  {
    title: "Ecosystem",
    items: [
      { title: "Package registry", href: "/registry" },
      { title: "Examples", href: "/examples" },
      { title: "Benchmarks", href: "/benchmark" },
      { title: "Deployment", href: "/deploy" },
    ],
  },
  {
    title: "Project",
    items: [
      { title: "GitHub", href: site.repo, external: true },
      { title: "Changelog", href: "/changelog" },
      { title: "Community", href: "/community" },
      { title: "About", href: "/about" },
    ],
  },
];
