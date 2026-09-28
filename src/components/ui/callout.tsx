import { AlertTriangle, CheckCircle2, Info, Lightbulb, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "note" | "tip" | "warning" | "danger" | "success";

const ICONS = {
  note: Info,
  tip: Lightbulb,
  warning: AlertTriangle,
  danger: ShieldAlert,
  success: CheckCircle2,
} as const;

const COLORS: Record<Kind, string> = {
  note: "text-[var(--ink-muted)] border-[var(--line)] bg-[var(--surface)]",
  tip: "text-[var(--accent)] border-[var(--accent)]/30 bg-[var(--accent-soft)]",
  warning: "text-[var(--warn)] border-[var(--warn)]/30 bg-transparent",
  danger: "text-[var(--bad)] border-[var(--bad)]/30 bg-transparent",
  success: "text-[var(--ok)] border-[var(--ok)]/30 bg-transparent",
};

const TITLES: Record<Kind, string> = {
  note: "Note",
  tip: "Tip",
  warning: "Warning",
  danger: "Caution",
  success: "Good to know",
};

/**
 * A callout. Used in prose, so it renders as an aside with a visible label
 * rather than an icon alone: an unlabelled coloured box is not an accessible
 * way to say "this will bite you".
 */
export function Callout({
  kind = "note",
  title,
  className,
  children,
}: {
  kind?: Kind;
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const Icon = ICONS[kind];
  return (
    <aside className={cn("my-6 flex gap-3 rounded-xl border p-4 text-sm", COLORS[kind], className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="font-semibold">{title ?? TITLES[kind]}</p>
        <div className="mt-1 text-[var(--ink-muted)] [&>:first-child]:mt-0 [&>:last-child]:mb-0">
          {children}
        </div>
      </div>
    </aside>
  );
}
