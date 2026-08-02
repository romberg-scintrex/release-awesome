"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { scrollWindowTo, subscribeScrollProgress } from "@/components/Elements/ScrollSmooth";

export function ScrollTop() {
  const [progress, setProgress] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => subscribeScrollProgress(setProgress), []);

  const visible = progress > 0.06;
  const fill = `${Math.min(100, Math.max(0, progress * 100))}%`;

  return (
    <motion.div
      initial={false}
      animate={{
        opacity: visible ? 1 : 0,
        y: visible ? 0 : 16,
        pointerEvents: visible ? "auto" : "none",
      }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-10 right-6 z-40 hidden md:flex md:items-stretch md:gap-2.5"
    >
      <span
        aria-hidden
        className="flex h-[7rem] items-center justify-center select-none font-mono text-[8px] uppercase leading-none tracking-[0.22em] text-ink-400 dark:text-ink-300 [writing-mode:vertical-rl] rotate-180"
      >
        Scroll to top
      </span>

      <div className="relative h-[7rem] w-[2.35rem] overflow-hidden rounded-full border border-ink-900/12 bg-ink-100 dark:border-white/20 dark:bg-ink-950">
        <button
          type="button"
          onClick={() => scrollWindowTo(0)}
          aria-label="Scroll to top"
          className="absolute left-1/2 top-1 z-20 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-[#162033] text-white transition-transform duration-300 hover:scale-105 dark:bg-[#1a2744]"
        >
          <ArrowUp size={12} strokeWidth={2.25} />
        </button>
        <motion.div
          aria-hidden
          className="absolute inset-x-0 bottom-0 bg-white"
          initial={false}
          animate={{ height: fill }}
          transition={reduce ? { duration: 0 } : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            borderBottomLeftRadius: 9999,
            borderBottomRightRadius: 9999,
          }}
        />
      </div>
    </motion.div>
  );
}
