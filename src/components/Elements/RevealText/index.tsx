"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Tag = "h1" | "h2" | "h3" | "h4" | "p" | "span";

interface TextRevealProps {
  text: string;
  as?: Tag;
  className?: string;
  delay?: number;
  /** seconds between words */
  stagger?: number;
  once?: boolean;
  amount?: number;
}

/**
 * Framer-style per-word text reveal: each word rises out of its own clip
 * mask with a soft stagger when the element scrolls into view.
 *
 * The DOM shape is identical regardless of prefers-reduced-motion (reduced
 * motion only changes the variant VALUES to a plain group fade) — branching
 * to a different tree would mismatch the server HTML during hydration,
 * because useReducedMotion is null on the server but resolves synchronously
 * on the first client render.
 */
export function TextReveal({
  text,
  as = "span",
  className,
  delay = 0,
  stagger = 0.045,
  once = true,
  amount = 0.5,
}: Readonly<TextRevealProps>) {
  const prefersReducedMotion = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.span;
  const words = text.split(" ");

  return (
    <MotionTag
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: prefersReducedMotion ? 0 : stagger,
            delayChildren: delay,
          },
        },
      }}
      aria-label={text}
      className={className}
    >
      {words.map((word, i) => (
        <span
          key={word + String(i)}
          aria-hidden
          // pb/-mb give descenders (g, y, p) room inside the clip mask
          className="inline-block overflow-hidden align-bottom pb-[0.1em] -mb-[0.1em]"
        >
          <motion.span
            variants={{
              hidden: {
                y: prefersReducedMotion ? "0%" : "110%",
                opacity: prefersReducedMotion ? 0 : 1,
              },
              visible: {
                y: "0%",
                opacity: 1,
                transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            className={cn("inline-block", i < words.length - 1 && "whitespace-pre")}
          >
            {word + (i < words.length - 1 ? " " : "")}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}
