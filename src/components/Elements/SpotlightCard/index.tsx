"use client";

import { useRef, type PropsWithChildren, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
  className?: string;
  as?: "div" | "figure" | "article" | "li";
  /** Optional custom CSS color/variable string, defaults to CSS variable --spotlight-color */
  color?: string;
}

export function SpotlightCard({
  children,
  className,
  as = "div",
  color,
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

  // Jika prop color dikirim, gunakan nilainya; jika tidak, fallback ke --spotlight-color di globals.css
  const spotlightColor = color ?? "var(--spotlight-color, rgba(16, 185, 129, 0.12))";

  return (
    <Tag ref={ref} onMouseMove={onMove} className={cn("group/spot relative", className)}>
      {children}
      <div
        aria-hidden
        className="hide-on-touch pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{
          background: `radial-gradient(320px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${spotlightColor}, transparent 70%)`,
        }}
      />
    </Tag>
  );
}