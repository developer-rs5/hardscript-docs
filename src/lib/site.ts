/** Everything about the site that appears in more than one place. */

export const site = {
  name: "HardScript",
  tagline: "Build backend APIs at native speed.",
  description:
    "HardScript is a compiled backend language with a built-in ORM, authentication, cache, queue, scheduler, deployment, package manager, registry and Docker support.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://hardscript.org",
  repo: "https://github.com/hardscript-lang/hard-script",
  docsRepo: "https://github.com/hardscript-lang/hard-docs",
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
  {
    title: "Documentation",
    items: [
      { title: "Introduction", href: "/docs/introduction" },
      { title: "Getting started", href: "/docs/getting-started" },
      { title: "Language reference", href: "/docs/language" },
      { title: "HTTP server", href: "/docs/http" },
      { title: "ORM", href: "/docs/orm" },
      { title: "Authentication", href: "/docs/auth" },
    ],
  },
  {
    title: "Reference",
    items: [
      { title: "CLI reference", href: "/cli" },
      { title: "API reference", href: "/api-reference" },
      { title: "Error catalog", href: "/docs/errors" },
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
