"use client";

import { SectionHeading } from "@/components/Fragments/SectionHeading";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { SlideItem } from "@/lib/types";

interface SlideDesktopHeading {
  index?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  headingAs?: "h2" | "h3";
}

interface SlideDesktopProps {
  slides: SlideItem[];
  /** Autoplay interval in ms. Pass 0 to disable autoplay entirely. */
  autoPlayMs?: number;
  className?: string;
  /** Optional heading rendered above the slider, inside the same <section>. */
  heading?: SlideDesktopHeading;
}

export function SlideDesktop({
  slides,
  autoPlayMs = 60000,
  className,
  heading,
}: SlideDesktopProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const count = slides.length;

  // Safe client-side reduced motion check to avoid hydration mismatch
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);

    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(((index % count) + count) % count);
    },
    [count]
  );

  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const prev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    if (!autoPlayMs || isPaused || reducedMotion || count <= 1) return;
    timerRef.current = setTimeout(next, autoPlayMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeIndex, autoPlayMs, isPaused, reducedMotion, count, next]);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const activeEl = menu.children[activeIndex] as HTMLElement | undefined;
    if (!activeEl) return;

    const target =
      activeEl.offsetLeft - (menu.clientWidth - activeEl.clientWidth) / 2;

    menu.scrollTo({ left: target, behavior: "smooth" });
  }, [activeIndex]);

  useEffect(() => {
    videoRefs.current.forEach((videoEl, i) => {
      if (!videoEl) return;
      if (i === activeIndex) {
        videoEl.currentTime = 0;
        videoEl.play().catch(() => {});
      } else {
        videoEl.pause();
      }
    });
  }, [activeIndex]);

  if (count === 0) return null;

  return (
    <section
      className="relative flex h-screen w-full flex-col justify-between border-y border-black/10 py-8 dark:border-white/10"
      aria-label={heading?.title ?? slides[activeIndex].title}
      style={
        {
          "--slider-progress-duration": `${autoPlayMs}ms`,
        } as React.CSSProperties
      }
    >
      {heading && (
        <div className="container">
          <SectionHeading
            index={heading.index}
            eyebrow={heading.eyebrow}
            title={heading.title}
            description={heading.description}
            as={heading.headingAs ?? "h2"}
          />
        </div>
      )}

      <div
        className={cn(
          "relative hidden h-full flex-1 w-full overflow-hidden bg-ink-800 md:block",
          heading && "mt-6",
          className
        )}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        role="region"
        aria-roledescription="carousel"
        aria-label={slides[activeIndex].title}
      >
        {/* Canvas layer */}
        <div className="absolute inset-0 z-0">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 ease-out-expo",
                i === activeIndex ? "opacity-100" : "opacity-0"
              )}
              aria-hidden={i !== activeIndex}
            >
              {slide.video ? (
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el;
                  }}
                  muted
                  loop
                  playsInline
                  poster={slide.poster}
                  className="h-full w-full object-cover"
                >
                  <source src={slide.video} type="video/mp4" />
                </video>
              ) : slide.image ? (
                <Image
                  src={slide.image}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="(min-width: 1400px) 1400px, 100vw"
                  className="object-cover"
                />
              ) : null}
            </div>
          ))}
        </div>

        {/* Top-shadow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-60 bg-gradient-to-b from-black/65 to-transparent" />

        {/* Prev / Next controls */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Slide sebelumnya"
              className="glass ring-focus absolute left-4 top-1/2 z-30 -translate-y-1/2 rounded-full p-2.5 text-white transition hover:bg-white/15"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Slide berikutnya"
              className="glass ring-focus absolute right-4 top-1/2 z-30 -translate-y-1/2 rounded-full p-2.5 text-white transition hover:bg-white/15"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </>
        )}

        {/* Menu layer */}
        <div
          ref={menuRef}
          role="tablist"
          aria-label="Pilih slide"
          className="absolute inset-0 z-20 flex w-full overflow-hidden"
        >
          {slides.map((slide, i) => {
            const isActive = i === activeIndex;
            return (
              <div
                key={slide.id}
                role="tab"
                tabIndex={0}
                aria-selected={isActive}
                onClick={() => goTo(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    goTo(i);
                  }
                }}
                className={cn(
                  "group relative flex h-full flex-1 cursor-pointer flex-col justify-between border-l border-white/10 px-4 py-6 text-left transition-colors duration-300 first:border-l-0 sm:px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                  isActive ? "bg-black/40" : "bg-black/5 hover:bg-black/25"
                )}
              >
                <header className="relative">
                  <span
                    className={cn(
                      "text-sm font-semibold uppercase tracking-wide transition-colors duration-300",
                      isActive ? "text-white" : "text-white/70"
                    )}
                  >
                    {slide.title}
                  </span>
                  {isActive && !reducedMotion && autoPlayMs > 0 && !isPaused && (
                    <span
                      key={activeIndex}
                      className="animate-progress-fill absolute -bottom-2 left-0 h-0.5 w-full origin-left bg-accent"
                    />
                  )}
                </header>

                <div
                  className={cn(
                    "grid transition-all duration-300",
                    isActive ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    {slide.description && (
                      <p className="text-xs leading-relaxed text-white/80 line-clamp-6">
                        {slide.description}
                      </p>
                    )}
                    {slide.href && (
                      <a
                        href={slide.href}
                        onClick={(e) => e.stopPropagation()}
                        className="btn-sheen ring-focus mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/60 px-4 py-1.5 text-[11px] font-medium text-white transition hover:border-white hover:bg-white/10"
                      >
                        {slide.ctaLabel ?? "Selengkapnya"}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}