/**
 * Turning fenced code blocks into components.
 *
 * A fence in the content tree becomes a `<CodeBlock>`, which highlights on the
 * server. The title line after the language — ```hard title=app.hard — becomes
 * the filename in the header, because a snippet without a filename is harder to
 * copy into the right file than one with it.
 *
 * This is a remark plugin rather than a rehype one so the code stays a string
 * all the way through: no HTML round trip, no entity escaping to undo, and the
 * exact bytes the reader copies are the exact bytes that were compiled.
 */

import { visit } from "unist-util-visit";

type Node = {
  type: string;
  lang?: string | null;
  meta?: string | null;
  value?: string;
  data?: Record<string, unknown>;
  children?: Node[];
};

type Options = {
  /** Fence languages that are compiled and must be highlighted as HardScript. */
  hardLanguages?: string[];
};

export function remarkCodeBlocks(options: Options = {}) {
  const hard = new Set(options.hardLanguages ?? ["hard", "hardscript", "hs"]);

  return function transformer(tree: Node) {
    visit(tree, "code", (node: Node, index: number | undefined, parent: Node | undefined) => {
      if (!parent?.children || index === undefined) return;
      const lang = (node.lang ?? "text").toLowerCase();
      const meta = node.meta ?? "";
      const attrs: Record<string, string> = {};

      for (const part of meta.split(/\s+/).filter(Boolean)) {
        const m = /^(title|filename|caption)=(.+)$/.exec(part);
        if (m) {
          attrs[m[1]] = m[2].replace(/^["']|["']$/g, "");
          continue;
        }
        const h = /^highlight=(.+)$/.exec(part);
        if (h) attrs.highlight = h[1];
        const n = /^lines=(true|false)$/.exec(part);
        if (n) attrs.lines = n[1];
      }

      const isHard = hard.has(lang);
      // A fence with no language is prose-as-code: show it, do not highlight it.
      const value = node.value ?? "";

      parent.children[index] = {
        type: "mdxJsxFlowElement",
        name: "CodeBlock",
        attributes: [
          { type: "mdxJsxAttribute", name: "code", value },
          { type: "mdxJsxAttribute", name: "lang", value: isHard ? "hard" : lang },
          ...(attrs.title
            ? [{ type: "mdxJsxAttribute", name: "filename", value: attrs.title }]
            : []),
          ...(attrs.caption
            ? [{ type: "mdxJsxAttribute", name: "caption", value: attrs.caption }]
            : []),
          ...(attrs.lines === "true"
            ? [{ type: "mdxJsxAttribute", name: "lineNumbers", value: true }]
            : []),
          ...(attrs.highlight
            ? [
                {
                  type: "mdxJsxAttribute",
                  name: "highlightLines",
                  value: attrs.highlight
                    .split(",")
                    .map((s) => Number(s.trim()))
                    .filter((n) => Number.isFinite(n)),
                },
              ]
            : []),
        ],
        children: [],
      } as Node;
    });
  };
}
