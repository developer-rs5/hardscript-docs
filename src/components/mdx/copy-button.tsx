"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Copies a snippet. The button reports success for two seconds and then
 * forgets, so it cannot be left claiming something untrue, and a failure is
 * visible rather than silent.
 */
export function CopyButton({ code }: { code: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={state === "copied" ? "Copied" : "Copy code"}
      title={state === "copied" ? "Copied" : "Copy"}
      className="absolute right-2.5 top-2.5 inline-flex size-7 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--canvas)]/80 text-[var(--ink-subtle)] opacity-0 transition-opacity hover:text-[var(--ink)] focus-visible:opacity-100 group-hover:opacity-100"
    >
      {state === "copied" ? (
        <Check className="size-3.5 text-[var(--ok)]" aria-hidden />
      ) : state === "failed" ? (
        <span className="text-[11px] text-[var(--bad)]" aria-hidden>
          !
        </span>
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
    </button>
  );
}
