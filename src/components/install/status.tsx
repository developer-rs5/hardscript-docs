import { CheckCircle2, CircleDashed } from "lucide-react";
import type { InstallStatus } from "@/lib/install";

/**
 * A method's verification state, stated the same way for every method.
 *
 * `Verified` means the commands ran and produced the output described. `Planned`
 * means the packaging artifact does not exist yet, and the page says which one.
 * The two are visually different on purpose: an install page that looks equally
 * confident about both is how an untested command gets typed.
 */
export function Status({ status, verifiedOn }: { status: InstallStatus; verifiedOn?: string }) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ok)]/30 bg-[var(--ok)]/10 px-2.5 py-0.5 text-[12px] font-medium text-[var(--ok)]">
        <CheckCircle2 className="size-3.5" aria-hidden />
        Verified
        {verifiedOn ? <span className="font-normal text-[var(--ink-subtle)]">· {verifiedOn}</span> : null}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-strong)] bg-[var(--surface-2)] px-2.5 py-0.5 text-[12px] font-medium text-[var(--ink-subtle)]">
      <CircleDashed className="size-3.5" aria-hidden />
      Planned
    </span>
  );
}
