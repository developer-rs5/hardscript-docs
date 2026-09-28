import { AlertTriangle, CircleAlert, CircleCheck, Info, Lightbulb } from "lucide-react";

const KINDS = {
  note: { icon: Info, label: "Note", tone: "text-[var(--info)] border-[var(--info)]/25 bg-[var(--info)]/8" },
  tip: { icon: Lightbulb, label: "Tip", tone: "text-[var(--ok)] border-[var(--ok)]/25 bg-[var(--ok)]/8" },
  warning: { icon: AlertTriangle, label: "Warning", tone: "text-[var(--warn)] border-[var(--warn)]/30 bg-[var(--warn)]/8" },
  danger: { icon: CircleAlert, label: "Danger", tone: "text-[var(--bad)] border-[var(--bad)]/30 bg-[var(--bad)]/8" },
  success: { icon: CircleCheck, label: "Success", tone: "text-[var(--ok)] border-[var(--ok)]/25 bg-[var(--ok)]/8" },
  /** Compiler behaviour that differs from what a reader might expect. */
  limitation: { icon: AlertTriangle, label: "Known limitation", tone: "text-[var(--warn)] border-[var(--warn)]/35 bg-[var(--warn)]/10" },
} as const;

export type CalloutKind = keyof typeof KINDS;

/**
 * A callout with a visible label.
 *
 * The label is text, not just an icon: a coloured box with a pictogram is not
 * accessible, and "known limitation" needs to survive being read aloud or
 * skimmed.
 */
export function Callout({
  kind = "note",
  title,
  children,
}: {
  kind?: CalloutKind;
  title?: string;
  children: React.ReactNode;
}) {
  const { icon: Icon, label, tone } = KINDS[kind];
  return (
    <aside className={`my-6 rounded-lg border px-4 py-3.5 ${tone}`}>
      <p className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold tracking-tight text-[var(--ink)]">
        <Icon className="size-4" aria-hidden />
        {title ?? label}
      </p>
      <div className="text-[14.5px] leading-[1.7] text-[var(--ink-muted)] [&>p]:my-1.5 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
        {children}
      </div>
    </aside>
  );
}
