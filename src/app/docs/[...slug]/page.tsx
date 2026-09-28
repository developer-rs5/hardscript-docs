import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { remarkCodeBlocks } from "@/lib/remark-code";
import { mdxComponents } from "@/mdx-components";
import { allPages, pageBody, pageBySlug, tableOfContents } from "@/lib/docs";
import { DocsPager } from "@/components/docs/pager";
import { DocsToc } from "@/components/docs/toc";
import { SectionIntro } from "@/components/docs/section-intro";
import { DraftNote } from "@/components/docs/draft-note";
import { getAllDocSlugs, isSectionIndex } from "@/lib/docs-paths";

/**
 * One route for the whole tree.
 *
 * The content tree is the route table: a page exists because a file exists, and
 * a file that fails to parse is a build error rather than an empty page. Every
 * page is prerendered, so the docs are HTML on a CDN.
 */
export function generateStaticParams() {
  return getAllDocSlugs()
    .filter((slug) => slug !== "/docs")
    .map((slug) => ({ slug: slug.split("/").slice(2) }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = pageBySlug(`/docs/${(slug ?? []).join("/")}`);
  if (!page) return {};
  return {
    title: `${page.title} — HardScript`,
    description: page.description,
    alternates: { canonical: page.slug },
    openGraph: {
      title: `${page.title} — HardScript`,
      description: page.description,
      url: page.slug,
      type: "article",
    },
  };
}

export default async function DocPageRoute({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const page = pageBySlug(`/docs/${(slug ?? []).join("/")}`);
  if (!page) notFound();

  const body = pageBody(page);
  const toc = tableOfContents(body);
  const isIndex = isSectionIndex(page.slug);

  const { content } = await compileMDX({
    source: body,
    components: mdxComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm, remarkCodeBlocks],
        rehypePlugins: [],
      },
      parseFrontmatter: false,
    },
  });

  return (
    <div
      className={
        "grid gap-x-10 " +
        (toc.length > 1 ? "xl:grid-cols-[minmax(0,1fr)_190px]" : "grid-cols-1")
      }
    >
      <article className="min-w-0 max-w-[76ch]">
        {isIndex ? <SectionIntro page={page} /> : null}
        {page.draft ? <DraftNote /> : null}
        {isIndex ? <IndexListings slug={page.slug} /> : null}
        {content}
        <DocsPager slug={page.slug} />
      </article>
      {toc.length > 1 ? (
        <div className="hidden xl:block">
          <div className="sticky top-[92px] max-h-[calc(100vh-120px)] overflow-y-auto py-10">
            <DocsToc headings={toc} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** The pages inside a section, for a section index. */
function IndexListings({ slug }: { slug: string }) {
  const page = pageBySlug(slug);
  const siblings = allPages().filter((p) => p.section === page?.section && p.slug !== slug);
  if (siblings.length === 0) return null;
  return (
    <ul className="mb-10 grid gap-2 sm:grid-cols-2">
      {siblings
        .sort((a, b) => a.order - b.order)
        .map((p) => (
          <li key={p.slug}>
            <a
              href={p.slug}
              className="group block rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3.5 transition-colors hover:border-[var(--line-strong)]"
            >
              <span className="block text-[14.5px] font-medium tracking-tight">{p.title}</span>
              <span className="mt-1 block text-[13.5px] leading-[1.6] text-[var(--ink-muted)]">
                {p.description}
              </span>
            </a>
          </li>
        ))}
    </ul>
  );
}
