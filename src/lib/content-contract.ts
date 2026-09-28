/**
 * The content contract.
 *
 * Two things live here, and both are enforced by `npm run docs:validate`:
 *
 * 1. **Where content is.** `content/docs/**\/*.mdx` is the tree. Nothing else
 *    is a page.
 * 2. **What a page must contain.** Every page declares a `template`, and each
 *    template lists the sections it owes the reader. A reference page owes
 *    different things from a concept page; holding both to the same list would
 *    either be dishonest or so loose it catches nothing.
 */

export const CONTENT_ROOT = "content/docs";

/** Frontmatter every page carries. */
export type Frontmatter = {
  title: string;
  description: string;
  /** Grouping in the sidebar. */
  section: string;
  /** Sort key within the section. Lower is earlier. */
  order: number;
  template: TemplateId;
  /** Language version the page describes, when it matters. */
  version?: string;
  /** Mark a page as a stub so the build can tell planned from published. */
  draft?: boolean;
  keywords?: string[];
};

export type TemplateId =
  /** A concept a reader learns: explanation, syntax, examples, and the rest. */
  | "concept"
  /** A reference page: a description per entry and an index, not a tutorial. */
  | "reference"
  /** A task the reader performs: prerequisites, steps, and how to tell it worked. */
  | "guide"
  /** Generated from a source of truth in the compiler. */
  | "generated"
  /** A section landing page: a list of what is inside, not an article. */
  | "index";

/**
 * The sections each template owes.
 *
 * These are checked by heading, case-insensitively, anywhere in the page. A
 * page that omits one fails the build, which is the only way "every page must
 * contain performance notes" stays true as the tree grows.
 */
export const TEMPLATE_SECTIONS: Record<TemplateId, string[]> = {
  concept: [
    "Explanation",
    "Syntax",
    "Examples",
    "Performance",
    "Best practices",
    "Common mistakes",
    "Related",
  ],
  guide: ["Prerequisites", "Steps", "Verify", "Troubleshooting", "Related"],
  reference: ["Overview", "Reference", "Notes"],
  generated: [],
  // A section landing page is a table of contents with a sentence of
  // introduction, and holding it to a tutorial's section list would only
  // produce filler.
  index: [],
};

/** Sections that are allowed to be missing, with the reason recorded. */
export const TEMPLATE_EXEMPT: Record<TemplateId, Record<string, string>> = {
  concept: {},
  guide: {},
  reference: {},
  generated: {},
  index: {},
};

/**
 * The section tree of the sidebar. Order here is the order in the sidebar;
 * `order` in a page's frontmatter orders pages *within* a section.
 */
export type Section = {
  title: string;
  slug: string;
  blurb: string;
};

export const SECTIONS: Section[] = [
  { title: "Introduction", slug: "introduction", blurb: "What HardScript is and how a program is put together." },
  { title: "Getting started", slug: "getting-started", blurb: "Install, write one file, run it." },
  { title: "Language", slug: "language", blurb: "Values, functions, control flow, errors, async." },
  { title: "HTTP", slug: "http", blurb: "Routes, middleware, bodies, streaming, WebSockets." },
  { title: "ORM", slug: "orm", blurb: "Models, relationships, transactions, migrations." },
  { title: "Runtime", slug: "runtime", blurb: "What the compiler emits and what runs it." },
  { title: "Tooling", slug: "tooling", blurb: "CLI, formatter, diagnostics, incremental builds." },
  { title: "Registry", slug: "registry", blurb: "Publishing, signatures, mirrors, the lockfile." },
  { title: "Errors", slug: "errors", blurb: "Every HSxxxx diagnostic, with fixes." },
  {
    title: "Limitations",
    slug: "limitations",
    blurb: "Every gap between the language people expect and what compiles, and where each is fixed.",
  },
];

/** Words a page may not claim without a measured number behind it. */
export const FORBIDDEN_CLAIMS = [
  /\b\d+(\.\d+)?\s*x\s+faster\b/i,
  /\bblazingly fast\b/i,
  /\bzero[- ]cost\b/i,
  /\bthe fastest\b/i,
  /\b10x\b/i,
  /\b100x\b/i,
  /\bguaranteed\b/i,
];

/**
 * Snippet languages the validator knows how to check.
 *
 * Only `hard` is compiled. Showing code in a language we cannot run would be
 * the documentation equivalent of a screenshot that no longer matches.
 */
export const VALIDATED_LANGUAGES = new Set(["hard", "hardscript", "hs"]);

/** Languages allowed in a fence, and whether they are compiled. */
export const FENCE_LANGUAGES = new Set([
  "hard",
  "hardscript",
  "hs",
  "json",
  "toml",
  "bash",
  "sh",
  "shell",
  "console",
  "text",
  "diff",
  "yaml",
  "sql",
  "dockerfile",
  "ini",
  "rust",
  "cpp",
  "typescript",
]);
