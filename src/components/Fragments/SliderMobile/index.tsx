"use client";

import { useState } from "react";
import Image from "next/image";
import { SectionHeading } from "@/components/Fragments/SectionHeading";
import type { SlideItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SlideMobileHeading {
  index?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  headingAs?: "h2" | "h3";
}

interface SlideMobileProps {
  slides: SlideItem[];
  heading?: SlideMobileHeading;
  className?: string;
}

export function SlideMobile({ slides, heading, className }: SlideMobileProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!slides.length) return null;

  return (
    <section
      className={cn(
        "relative flex h-[100svh] min-h-[580px] w-full flex-col justify-between border-y border-black/10 py-6 dark:border-white/10 md:hidden",
        className
      )}
    >
      {/* Header Mobile */}
      {heading && (
        <div className="container mb-4 shrink-0">
          <SectionHeading
            index={heading.index}
            eyebrow={heading.eyebrow}
            title={heading.title}
            description={heading.description}
            as={heading.headingAs ?? "h2"}
          />
        </div>
      )}

      {/* Track Horizontal Snap */}
      <div
        className="flex h-full w-full flex-1 snap-x snap-mandatory overflow-x-auto gap-4 px-5 scrollbar-none"
        onScroll={(e) => {
          const target = e.currentTarget;
          const cardWidth = target.firstElementChild?.clientWidth ?? target.clientWidth * 0.85;
          const index = Math.round(target.scrollLeft / (cardWidth + 16));
          if (index !== activeIndex && index >= 0 && index < slides.length) {
            setActiveIndex(index);
          }
        }}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className="relative flex h-full w-[85vw] max-w-[340px] shrink-0 snap-center flex-col justify-end overflow-hidden rounded-2xl border border-black/10 bg-ink-900 dark:border-white/10"
          >
            {/* Background Media */}
            {slide.video ? (
              <video
                muted
                loop
                autoPlay
                playsInline
                poster={slide.poster}
                className="absolute inset-0 h-full w-full object-cover opacity-60"
              >
                <source src={slide.video} type="video/mp4" />
              </video>
            ) : slide.image ? (
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                sizes="340px"
                className="object-cover opacity-60"
              />
            ) : null}

            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

            <div className="relative z-10 p-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-1 text-lg font-bold text-white leading-snug">
                {slide.title}
              </h3>
              {slide.description && (
                <p className="mt-2 text-xs leading-relaxed text-white/70 line-clamp-3">
                  {slide.description}
                </p>
              )}
              {slide.href && (
                <a
                  href={slide.href}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-md transition hover:bg-white/20"
                >
                  {slide.ctaLabel ?? "Read article"}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Indicator Dots */}
      {slides.length > 1 && (
        <div className="mt-4 flex shrink-0 justify-center gap-1.5">
          {slides.map((slide, i) => (
            <span
              key={slide.id}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === activeIndex
                  ? "w-6 bg-emerald-500"
                  : "w-1.5 bg-black/20 dark:bg-white/20"
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}