"use client";

import { SectionHeading } from "@/components/Fragments/SectionHeading";
import { Reveal } from "@/components/Elements/Reveal";
import { SpotlightCard } from "@/components/Elements/SpotlightCard";
import type { Testimonial } from "@/lib/types";

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section className="container relative py-16 sm:py-20">
      <SectionHeading
        index="01"
        eyebrow="Kind words"
        title="What people I've worked with say"
        description="Notes from collaborators, mentors, and clients."
        as="h3"
      />

      <Reveal className="mt-12">
        {/* hairline-divided grid: the px gaps reveal the container colour */}
        <div className="grid gap-px overflow-hidden rounded-3xl border border-ink-900/10 bg-ink-900/10 dark:border-white/10 dark:bg-white/10 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <SpotlightCard
              as="figure"
              key={t.name}
              className="group flex h-full flex-col bg-white p-7 transition-colors duration-300 hover:bg-ink-50 sm:p-8 dark:bg-ink-900 dark:hover:bg-ink-800"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-[11px] tabular-nums text-ink-300 dark:text-ink-600">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden
                  className="-mt-2 font-display text-5xl leading-none text-emerald-500/70 transition-transform duration-300 group-hover:-translate-y-0.5"
                >
                  &rdquo;
                </span>
              </div>

              <blockquote className="mt-4 flex-1 text-lg leading-relaxed text-ink-800 dark:text-ink-100 text-balance">
                {t.quote}
              </blockquote>

              <figcaption className="mt-6 border-t border-ink-900/10 pt-4 dark:border-white/10">
                <div className="text-sm font-semibold tracking-tight">{t.name}</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400">
                  {t.role}
                </div>
              </figcaption>
            </SpotlightCard>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
