"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

export function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.5 });

  const [enabled, setEnabled] = useState(false);
  const [variant, setVariant] = useState<"default" | "hover" | "view" | "text">("default");
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none)").matches;
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (isTouch || !isFinePointer) return;
    setEnabled(true);

    function onMove(e: MouseEvent) {
      x.set(e.clientX);
      y.set(e.clientY);

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest<HTMLElement>(
        "a, button, [role='button'], input, textarea, select, [data-cursor]",
      );
      if (interactive) {
        const dataCursor = interactive.dataset.cursor;
        if (dataCursor === "view") {
          setVariant("view");
          setLabel("VIEW");
        } else if (dataCursor === "open") {
          setVariant("view");
          setLabel("OPEN");
        } else if (interactive.tagName === "INPUT" || interactive.tagName === "TEXTAREA") {
          setVariant("text");
          setLabel("");
        } else {
          setVariant("hover");
          setLabel("");
        }
      } else {
        setVariant("default");
        setLabel("");
      }
    }

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [x, y]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        aria-hidden
        style={{ x: sx, y: sy }}
        className="pointer-events-none fixed left-0 top-0 z-[9999] hide-on-touch"
      >
        <motion.div
          animate={{
            width: variant === "view" ? 72 : variant === "hover" ? 44 : variant === "text" ? 4 : 10,
            height: variant === "view" ? 72 : variant === "hover" ? 44 : variant === "text" ? 28 : 10,
            borderRadius: variant === "text" ? 2 : 999,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={cn(
            "-translate-x-1/2 -translate-y-1/2 flex items-center justify-center",
            "border border-white mix-blend-difference bg-white/10 backdrop-blur-sm",
          )}
        >
          {label && (
            <span className="text-[10px] font-semibold tracking-widest text-white">{label}</span>
          )}
        </motion.div>
      </motion.div>
    </>
  );
}
