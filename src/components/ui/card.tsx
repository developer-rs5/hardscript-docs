import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h3 className={cn("text-[15px] font-semibold tracking-tight", className)}>{children}</h3>
  );
}

export function CardDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p className={cn("mt-1.5 text-sm text-[var(--ink-muted)]", className)}>{children}</p>
  );
}
