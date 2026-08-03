"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { type PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

interface RevealProps extends PropsWithChildren {
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "article" | "header" | "footer" | "li";
  once?: boolean;
  amount?: number;
}

export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  as = "div",
  once = true,
  amount = 0.2,
}: Readonly<RevealProps>) {
  const prefersReducedMotion = useReducedMotion();

  const variants: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : y },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
        delay,
      },
    },
  };

  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={variants}
      className={cn(className)}
    >
      {children}
    </MotionTag>
  );
}

export function RevealStagger({
  children,
  className,
  staggerChildren = 0.08,
  amount = "some",
}: PropsWithChildren<{
  className?: string;
  staggerChildren?: number;
  amount?: number | "some" | "all";
}>) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
  y = 20,
}: PropsWithChildren<{ className?: string; y?: number }>) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: prefersReducedMotion ? 0 : y },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
