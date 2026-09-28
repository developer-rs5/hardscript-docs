import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "ok" | "warn" | "bad";

const TONES: Record<Tone, string> = {
  neutral: "bg-[var(--surface-2)] text-[var(--ink-muted)] border-[var(--line)]",
  accent: "bg-[var(--accent-soft)] text-[var(--accent)] border-transparent",
  ok: "bg-transparent text-[var(--ok)] border-[var(--ok)]/30",
  warn: "bg-transparent text-[var(--warn)] border-[var(--warn)]/30",
  bad: "bg-transparent text-[var(--bad)] border-[var(--bad)]/30",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
