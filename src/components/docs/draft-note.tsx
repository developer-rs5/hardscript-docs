import { PencilLine } from "lucide-react";

/** Marks a page that is published but incomplete, so no reader mistakes it. */
export function DraftNote() {
  return (
    <p className="mb-8 flex items-center gap-2 rounded-lg border border-[var(--warn)]/30 bg-[var(--warn)]/8 px-3.5 py-2.5 text-[13.5px] text-[var(--ink-muted)]">
      <PencilLine className="size-4 text-[var(--warn)]" aria-hidden />
      This page is still being written. Everything on it is checked, but there
      may be more to come.
    </p>
  );
}
