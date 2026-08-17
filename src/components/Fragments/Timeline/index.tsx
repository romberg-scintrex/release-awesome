"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { GraduationCap, Briefcase } from "lucide-react";
import { timeline } from "@/lib/default";
import { cn } from "@/lib/utils";

export function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    // Perhitungan offset yang presisi dari saat bagian atas timeline memasuki 80% viewport
    // hingga titik ikon/konten terakhir memasuki area pandang.
    offset: ["start 75%", "end 85%"],
  });

  // Animasi tinggi garis dari 0% ke 100%
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section className="relative border-y border-black/10 py-12 dark:border-white/10">
      <div ref={containerRef} className="relative">
        {/* 1. Track Garis Dasar (Background Line) - Diberi batasan top & bottom agar pas di tengah-tengah ikon */}
        <div className="absolute left-5 top-5 bottom-5 w-px bg-[rgb(var(--fg)/0.1)] sm:left-6 sm:top-6 sm:bottom-6 pointer-events-none" />

        {/* 2. Garis Animasi Gradien (Progress Line) */}
        <motion.div
          style={{ height: lineHeight }}
          className="absolute left-5 top-5 w-px bg-gradient-to-b from-[rgb(var(--accent))] via-[rgb(var(--accent)/0.8)] to-[rgb(var(--fg)/0.3)] sm:left-6 sm:top-6 pointer-events-none origin-top"
        />

        {/* 3. Daftar Item Timeline */}
        <ul className="relative space-y-10 sm:space-y-12">
          {timeline.map((entry, i) => {
            const Icon = entry.type === "education" ? GraduationCap : Briefcase;
            return (
              <motion.li
                key={`${entry.title}-${i}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.08,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="relative flex gap-6 sm:gap-8"
              >
                {/* Node Icon Circle */}
                <div
                  className={cn(
                    "relative z-10 flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full border bg-[rgb(var(--bg))] transition-colors duration-300",
                    entry.type === "education"
                      ? "border-[rgb(var(--accent)/0.5)] text-[rgb(var(--accent))]"
                      : "border-[rgb(var(--fg)/0.2)] text-[rgb(var(--fg))]"
                  )}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>

                {/* Detail Konten */}
                <div className="pt-0.5 pb-2">
                  <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--accent))]">
                    {entry.year}
                  </span>
                  <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-[rgb(var(--fg))] sm:text-2xl">
                    {entry.title}
                  </h3>
                  <div className="mt-0.5 text-sm font-medium text-[rgb(var(--muted))]">
                    {entry.org}
                  </div>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[rgb(var(--muted))] sm:text-base">
                    {entry.description}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}