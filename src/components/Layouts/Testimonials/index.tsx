"use client";

import { SectionHeading } from "@/components/Fragments/SectionHeading";
import { Reveal } from "@/components/Elements/Reveal";
import { SpotlightCard } from "@/components/Elements/SpotlightCard";
import type { Testimonial } from "@/lib/types";

interface TestimonialsHeading {
  index?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  headingAs?: "h2" | "h3";
}

interface TestimonialsProps {
  testimonials: Testimonial[];
  /** Optional heading rendered above the grid, inside the same .container as the grid. */
  heading?: TestimonialsHeading;
}

export function Testimonials({ testimonials, heading }: TestimonialsProps) {
  if (testimonials.length === 0) return null;

  return (
    <section
      className="relative flex h-[100svh] min-h-[600px] w-full items-center justify-center overflow-hidden border-y border-ink-900/10 py-6 dark:border-white/10 md:py-8"
      aria-label={heading?.title ?? "Testimonials"}
    >
      <div className="container flex flex-col justify-center my-auto">
        {/* Top Heading */}
        {heading && (
          <div className="shrink-0 mb-6 md:mb-8">
            <SectionHeading
              index={heading.index}
              eyebrow={heading.eyebrow}
              title={heading.title}
              description={heading.description}
              as={heading.headingAs ?? "h2"}
            />
          </div>
        )}

        {/* Content Area - Centered Grid */}
        <Reveal className="w-full">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-ink-900/10 bg-ink-900/10 dark:border-white/10 dark:bg-white/10 md:grid-cols-3 md:rounded-3xl">
            {testimonials.map((t, i) => (
              <SpotlightCard
                as="figure"
                key={t.name}
                className="group flex flex-col justify-between bg-white p-5 transition-colors duration-300 hover:bg-ink-50 sm:p-6 lg:p-7 dark:bg-ink-900 dark:hover:bg-ink-800"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-[11px] tabular-nums text-ink-300 dark:text-ink-600">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      aria-hidden
                      className="-mt-2 font-display text-3xl leading-none text-emerald-500/70 transition-transform duration-300 group-hover:-translate-y-0.5 lg:text-4xl"
                    >
                      &rdquo;
                    </span>
                  </div>

                  <blockquote className="mt-2 text-xs leading-relaxed text-ink-800 line-clamp-4 sm:text-sm lg:mt-3 lg:text-base lg:line-clamp-6 dark:text-ink-100 text-balance">
                    {t.quote}
                  </blockquote>
                </div>

                <figcaption className="mt-4 border-t border-ink-900/10 pt-3 dark:border-white/10">
                  <div className="text-xs font-semibold tracking-tight lg:text-sm">{t.name}</div>
                  <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-400 lg:text-[10px]">
                    {t.role}
                  </div>
                </figcaption>
              </SpotlightCard>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}