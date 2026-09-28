import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[var(--accent)] text-white hover:brightness-110 border border-transparent shadow-sm",
  secondary:
    "bg-[var(--surface-2)] text-[var(--ink)] hover:bg-[var(--line)] border border-[var(--line)]",
  ghost: "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] border border-transparent",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
};

function classes(variant: Variant, size: Size, className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition-all",
    "disabled:opacity-50 disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={classes(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  external,
  ...rest
}: CommonProps & { href: string; external?: boolean }) {
  if (external) {
    return (
      <a
        href={href}
        className={classes(variant, size, className)}
        target="_blank"
        rel="noreferrer noopener"
        {...rest}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
