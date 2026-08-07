"use client";

import { useRef, type PropsWithChildren, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  className?: string;
  as?: "div" | "figure" | "article" | "li";
  /** CSS color of the spotlight tint */
  color?: string;
}

/**
 * Card with a soft radial highlight that tracks the cursor — the classic
 * modern-portfolio "spotlight" hover. Position is written to CSS variables
 * directly (no React re-renders per mousemove); inert on touch devices.
 */
export function SpotlightCard({
  children,
  className,
  as = "div",
  color = "rgba(139, 92, 246, 0.10)",
}: PropsWithChildren<SpotlightCardProps>) {
  const ref = useRef<HTMLDivElement | null>(null);
  const Tag = as as "div";

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  }

  return (
    <Tag ref={ref} onMouseMove={onMove} className={cn("group/spot relative", className)}>
      {children}
      <div
        aria-hidden
        className="hide-on-touch pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{
          background: `radial-gradient(320px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${color}, transparent 70%)`,
        }}
      />
    </Tag>
  );
}
