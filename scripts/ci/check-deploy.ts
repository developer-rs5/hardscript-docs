/**
 * Checks a deployed site.
 *
 * Everything else in this repository tests the build. This tests what actually
 * got deployed, which is a different thing and has failed in ways a local build
 * never could: a canonical URL pointing at a domain that does not resolve, a
 * robots.txt served as TypeScript source, a redirect that 404s, a hashed asset
 * that 404s because the build was partial.
 *
 * Usage:  npx tsx scripts/ci/check-deploy.ts [base-url]
 *
 * The default is the production URL. It is a script rather than a test because
 * it needs the network, and a test that depends on someone's CDN is a test that
 * fails for reasons that have nothing to do with the code.
 */

import { check, type Result } from "./lib/http";

const TIMEOUT_MS = 20_000;

const BASE = (process.argv[2] ?? process.env.HARD_DOCS_URL ?? "https://hardscript.netlify.app").replace(
  /\/$/,
  "",
);

type Check = {
  path: string;
  expect: number;
  /** Must appear in the body. */
  contains?: string[];
  /** Must not appear. */
  absent?: string[];
  headers?: Record<string, (value: string) => boolean>;
  note?: string;
};

/**
 * The routes that must exist.
 *
 * Every documentation page the content tree produces, plus the routes a reader
 * reaches from outside: the homepage, the install guide, and the two files a
 * search engine asks for before it looks at anything else.
 */
const ROUTES: Check[] = [
  {
    path: "/",
    expect: 200,
    contains: [
      "Build backend APIs at native speed",
      // The homepage used to advertise a command for a script that does not
      // exist. This is the most prominent string on the site, so it is asserted
      // rather than trusted.
      "cargo install --path cli",
    ],
  },
  { path: "/docs", expect: 200, contains: ["HardScript, documented"] },
  { path: "/docs/introduction", expect: 200, contains: ["What a program looks like"] },
  { path: "/docs/getting-started", expect: 200, contains: ["cargo install --path cli"] },
  { path: "/docs/language", expect: 200 },
  { path: "/docs/language/syntax", expect: 200, contains: ["Known limitation"] },
  // The structured callout, asserted by its registry id: that is what ties a
  // page to a tracked gap, and it is what the build checks. The prose around it
  // can be rewritten without breaking this.
  { path: "/docs/language/values", expect: 200, contains: ["Compiles today", 'id="l-06-unimplemented-methods"'] },
  {
    path: "/docs/language/control-flow",
    expect: 200,
    contains: ["Compiles today", 'id="l-01-no-else"', 'id="l-02-while-and-for"'],
  },
  { path: "/docs/language/functions", expect: 200, contains: ["calc"] },
  { path: "/docs/language/errors", expect: 200, contains: ["HS0104"] },
  { path: "/docs/http", expect: 200 },
  { path: "/docs/http/routes", expect: 200, contains: ["Path parameters"] },
  { path: "/docs/http/websockets", expect: 200, contains: ["websocket.join"] },
  { path: "/docs/orm", expect: 200 },
  { path: "/docs/orm/models", expect: 200, contains: ["Known limitation"] },
  { path: "/docs/orm/postgres", expect: 200, contains: ["postgres.connect"] },
  { path: "/docs/runtime", expect: 200, contains: ["translation unit"] },
  { path: "/docs/tooling", expect: 200 },
  { path: "/docs/tooling/cli", expect: 200, contains: ["hard fmt"] },
  { path: "/docs/registry", expect: 200, contains: ["hard.lock"] },
  { path: "/docs/errors", expect: 200 },
  { path: "/docs/errors/catalog", expect: 200, contains: ["HS0001"] },
  { path: "/docs/limitations", expect: 200, contains: ["L-01", "L-10"] },
  { path: "/install", expect: 200, contains: ["Verified", "Planned", "cargo install"] },
  { path: "/robots.txt", expect: 200, contains: ["User-Agent", "Sitemap"], note: "a search engine asks for this first" },
  {
    path: "/sitemap.xml",
    expect: 200,
    contains: ["<urlset", "/docs/language/syntax"],
    note: "generated from the content tree, so it cannot fall behind it",
  },
  { path: "/manifest.webmanifest", expect: 200, contains: ["HardScript"] },
  { path: "/favicon.svg", expect: 200 },
  // A route that must not exist. A 200 here means the catch-all is answering
  // everything, which turns a typo into a page and hides it from the sitemap.
  { path: "/docs/this-page-does-not-exist", expect: 404 },
  { path: "/nope", expect: 404 },
];

/**
 * Things that must hold across the site, not on one page.
 *
 * Split in two because this script is useful in both places: run against a
 * production URL it checks what the CDN did, and run against a local server it
 * checks the content. A local run has no CDN, so cache headers and redirect
 * statuses are not its business — and asserting them there produces four failures
 * that describe the tool, not the site.
 */
const GLOBAL: Check[] = [
  {
    path: "/docs/language/syntax",
    expect: 200,
    // The bug this catches: a placeholder domain in site.url that builds
    // cleanly and points every canonical at nowhere.
    contains: ['rel="canonical"'],
    absent: ["hardscript.org", "hardscript-lang", "hard-script\""],
  },
  {
    path: "/",
    expect: 200,
    contains: ['rel="canonical"', "cargo install --path cli"],
    absent: ["hardscript.org", "hardscript-lang"],
  },
  {
    // Not the directory: a CDN answers a directory with a 308 to its
    // slashless form, which says nothing. A missing chunk should be a 404.
    path: "/_next/static/chunk-that-was-never-built.js",
    expect: 404,
    note: "an asset that does not exist should be a 404, not a 200",
  },
  {
    path: "/robots.ts",
    expect: 404,
    note: "this used to serve the site's own TypeScript source to the public",
  },
];

async function main() {
  console.log(`deploy check: ${BASE}\n`);
  const results: Result[] = [];
  for (const route of [...ROUTES, ...GLOBAL]) {
    results.push(
      await check(BASE, {
        ...route,
        label: route.note ? `${route.path}  (${route.note})` : route.path,
      }),
    );
  }

  /**
   * Is this a CDN deployment, or a local server?
   *
   * Netlify stamps every response, and the answer decides whether the cache and
   * redirect expectations below apply at all. Asserting CDN behaviour against a
   * local server produces failures that describe the tool, not the site.
   */
  const probe = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  const isCdn =
    /netlify/i.test(probe.headers.get("server") ?? "") ||
    probe.headers.get("x-nf-request-id") !== null;
  const homeBody = await probe.text();
  // The capture group, not the whole match: the quotes are not part of the URL,
  // and asking for them produces a path no server has.
  const asset = /"(\/_next\/static\/[^"]+\.js)"/.exec(homeBody)?.[1];
  if (asset) {
    results.push(
      await check(BASE, {
        path: asset,
        expect: 200,
        headers: isCdn
          ? { "cache-control": (v: string) => /immutable|max-age=31536000/.test(v) }
          : {},
        label: `${asset}  (hashed asset${isCdn ? ", must be cached hard" : ""})`,
      }),
    );
  } else {
    results.push({ label: "hashed asset", ok: false, detail: "no /_next/static asset found in the homepage" });
  }

  if (isCdn) {
    // A generated page must not be cached past the deploy that generated it, or
    // a reader keeps yesterday's content and nobody notices for a week.
    results.push(
      await check(BASE, {
        path: "/docs",
        expect: 200,
        headers: { "cache-control": (v: string) => /must-revalidate|max-age=0/.test(v) },
        label: "/docs  (generated page, must not be cached past a deploy)",
      }),
    );

    const redirect = await fetch(`${BASE}/documentation`, { redirect: "manual" });
    results.push({
      label: "/documentation  (301 to /docs)",
      ok: redirect.status === 301,
      detail: redirect.status === 301 ? undefined : `status ${redirect.status}, expected 301`,
    });
  }

  const failed = results.filter((r) => !r.ok);
  for (const r of results) {
    const mark = r.ok ? "  ok  " : "  FAIL";
    console.log(`${mark} ${r.label}`);
    if (r.detail) console.log(`         ${r.detail}`);
  }
  console.log("");
  console.log(
    failed.length === 0
      ? `deploy: ${results.length} checks passed`
      : `deploy: ${failed.length} of ${results.length} checks failed`,
  );
  process.exit(failed.length === 0 ? 0 : 1);
}

main();
