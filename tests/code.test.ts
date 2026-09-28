import { describe, expect, it } from "vitest";
import { escapeHtml, highlight, resolveLang } from "@/lib/code";

describe("resolveLang", () => {
  it("maps HardScript onto the grammar that matches its syntax", () => {
    expect(resolveLang("hard")).toBe("rust");
    expect(resolveLang("HardScript")).toBe("rust");
    expect(resolveLang("hs")).toBe("rust");
  });

  it("normalises shell aliases", () => {
    expect(resolveLang("sh")).toBe("bash");
    expect(resolveLang("shell")).toBe("bash");
  });

  it("falls back to plain text rather than failing the build", () => {
    expect(resolveLang(undefined)).toBe("text");
    expect(resolveLang("brainfuck")).toBe("text");
  });
});

describe("highlight", () => {
  it("returns html for a known language", async () => {
    const html = await highlight("GET \"/\" :: { <- { ok: true } }", { lang: "hard" });
    expect(html).toContain("<pre");
    expect(html).toContain("shiki");
  });

  it("does not throw on an unknown language", async () => {
    const html = await highlight("whatever", { lang: "not-a-language" });
    expect(html).toContain("whatever");
  });
});

describe("escapeHtml", () => {
  it("escapes the characters that would break out of a code block", () => {
    expect(escapeHtml('<script>"x" & y</script>')).toBe(
      "&lt;script&gt;&quot;x&quot; &amp; y&lt;/script&gt;",
    );
  });
});
