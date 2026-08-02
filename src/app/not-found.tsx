"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Command } from "lucide-react";

export default function NotFound() {
  return (
    <section className="relative isolate min-h-screen overflow-hidden flex items-center">
      <div className="container relative pt-32 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 rounded-full border border-ink-900/10 dark:border-white/15 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-500"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-ink-400" />{" "}
          Page not found
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 font-display font-extrabold leading-none tracking-[-0.04em] text-balance"
          style={{ fontSize: "clamp(6rem, 22vw, 18rem)" }}
        >
          <span className="text-ink-900 dark:text-white">404</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-6 max-w-md text-base sm:text-lg text-ink-500 dark:text-ink-300"
        >
          The page you&apos;re looking for doesn&apos;t exist yet. It&apos;s coming soon! For now, head back home or use{" "}
          <kbd className="inline-flex items-center gap-1 rounded-md border border-black/10 dark:border-white/15 bg-white/60 dark:bg-white/5 px-1.5 py-0.5 text-[11px] font-mono text-ink-700 dark:text-ink-100">
            <Command size={11} />K
          </kbd>{" "}
          to navigate.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-ink-900 dark:bg-white px-6 py-3 text-sm font-medium text-white dark:text-ink-900 transition-colors hover:bg-ink-700 dark:hover:bg-ink-100"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
