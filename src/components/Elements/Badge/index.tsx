import { cn } from "@/lib/utils";
import { type PropsWithChildren } from "react";

interface BadgeProps {
  className?: string;
  pulse?: boolean;
}

export function Badge({ children, className, pulse }: PropsWithChildren<BadgeProps>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-ink-900/15 dark:border-white/15",
        "px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 dark:text-ink-300",
        className,
      )}
    >
      {pulse && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
      {children}
    </span>
  );
}
