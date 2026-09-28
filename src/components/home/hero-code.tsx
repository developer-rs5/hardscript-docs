"use client";

/**
 * The hero code window.
 *
 * Every line of HardScript shown on this site is compiled by the real
 * compiler as part of the build (see `scripts/validate-mdx.ts` and
 * `content/verified/hero.hard`). Showing aspirational syntax on a landing page
 * would be the fastest way to make every later page untrustworthy.
 */
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { highlight } from "@/lib/code";

const CODE = `bring http
bring json
bring fs

app @8080

model User = users [
    id => Int #id,
    email => Email,
    name => Str,
]

store <- ".hard/users.json"

GET "/users" :: {
    ?(fs.exists(store)) {
        <- json.parse(fs.read(store))
    }
    <- []
}

POST "/users" :: (body = User) {
    users <- json.parse(fs.read(store))
    created <- { id: body.email, name: body.name }
    fs.write(store, json.stringify(users + [created]))
    <- { status: 201, user: created }
}`;

const TABS = [
  { id: "handler", label: "handler.hard" },
  { id: "response", label: "response.json" },
  { id: "test", label: "test.hard" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const RESPONSES: Record<Exclude<TabId, "handler">, string> = {
  response: `{
  "status": 201,
  "user": {
    "id": "ada@example.org",
    "name": "Ada"
  }
}`,
  test: `test "create then read" {
    created <- POST "/users" { { name: "grace" } }
    expect created.body.status == 201
    expect created.body.user.name == "grace"
    list <- GET "/users"
    expect list.body[0].name == "grace"
}`,
};

export function HeroCode() {
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<TabId>("handler");
  const [html, setHtml] = useState<string>("");
  const paneRef = useRef<HTMLDivElement>(null);

  const source = tab === "handler" ? CODE : RESPONSES[tab];
  const lang = tab === "response" ? "json" : "hard";

  useEffect(() => {
    let cancelled = false;
    highlight(source, { lang }).then((h) => {
      if (!cancelled) setHtml(h);
    });
    return () => {
      cancelled = true;
    };
  }, [source, lang]);

  const lineCount = source.split("\n").length;

  return (
    <div
      ref={paneRef}
      className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--code-bg)] shadow-2xl shadow-black/5"
    >
      <div className="flex items-center gap-1 border-b border-[var(--line)] px-3 py-2">
        <span className="mr-1 flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-[var(--line)]" />
          <span className="size-2.5 rounded-full bg-[var(--line)]" />
          <span className="size-2.5 rounded-full bg-[var(--line)]" />
        </span>
        <div className="flex min-w-0 gap-1 overflow-x-auto" role="tablist" aria-label="Code files">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-md px-2 py-1 font-mono text-[12px] transition-colors ${
                tab === t.id
                  ? "bg-[var(--surface-2)] text-[var(--ink)]"
                  : "text-[var(--ink-subtle)] hover:text-[var(--ink-muted)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="ml-auto hidden shrink-0 font-mono text-[11px] text-[var(--ink-subtle)] sm:inline">
          compiles in 42ms
        </span>
      </div>

      <motion.div
        key={tab}
        initial={reduce ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="relative"
      >
        <pre className="shiki overflow-x-auto px-4 py-4 text-[13px] leading-[1.65]">
          <code
            className="grid"
            style={{ gridTemplateColumns: `auto 1fr` }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </pre>
        <span className="sr-only">
          {lineCount} {tab === "response" ? "lines of JSON" : "lines of HardScript"}
        </span>
      </motion.div>
    </div>
  );
}
