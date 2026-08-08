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
}

interface SlideDesktopProps {
  slides: SlideItem[];
  /** Autoplay interval in ms. Pass 0 to disable autoplay entirely. */
  autoPlayMs?: number;
  className?: string;
  /** Optional heading rendered above the slider, inside the same <section>. */
  heading?: SlideDesktopHeading;
}

/**
 * Full-bleed "click to preview" market/feature slider: a crossfading video or
 * image background, with a row of full-height nav cards (header always
 * visible, content + CTA revealed on the active card) laid on top.
 * Native implementation — no Slick/jQuery.
 *
 * Heading + carousel now live inside ONE <section> element (valid HTML5
 * outline: a <section> may contain a heading + its related content). The
 * carousel's inner wrapper — previously itself a <section> — is demoted to a
 * <div role="region"> so we don't end up with a bare, un-headed nested
 * <section>. This is purely a tag swap: the DOM order, the `relative` /
 * `overflow-hidden` stacking context, and paint order are all unchanged, so
 * the canvas/menu layers still sit correctly relative to the heading.
 */
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

  // Horizontal-only scroll to keep the active nav card in view inside the
  // menu strip. Deliberately NOT using `element.scrollIntoView()` here: even
  // with `block: "nearest"`, scrollIntoView recalculates the element's
  // position against the whole page viewport (not just this container), so
  // if the card is judged "not visible enough" vertically — e.g. the user
  // has scrolled down to Testimonials while autoplay advances the slide —
  // the browser yanks the entire page back up to this section. Scrolling
  // `menu.scrollLeft` directly only ever moves this container, never the page.
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const activeEl = menu.children[activeIndex] as HTMLElement | undefined;
    if (!activeEl) return;

    const target =
      activeEl.offsetLeft - (menu.clientWidth - activeEl.clientWidth) / 2;

    menu.scrollTo({ left: target, behavior: "smooth" });
  }, [activeIndex]);

  // Imperatively play the active video and pause the rest. The `autoPlay`
  // attribute only fires once on mount, so switching slides after that needs
  // an explicit .play()/.pause() call via ref — otherwise only slide 0 ever plays.
  useEffect(() => {
    videoRefs.current.forEach((videoEl, i) => {
      if (!videoEl) return;
      if (i === activeIndex) {
        videoEl.currentTime = 0;
        videoEl.play().catch(() => {
          // Autoplay can be rejected (e.g. tab backgrounded); safe to ignore.
        });
      } else {
        videoEl.pause();
      }
    });
  }, [activeIndex]);

  if (count === 0) return null;

  return (
    // Single <section> wraps heading + carousel together. Heading stays in
    // normal document flow, ahead of the `relative overflow-hidden` carousel
    // container in the DOM — so it keeps its own natural paint order and
    // can't be clipped or z-index-shadowed by the absolutely-positioned
    // canvas/menu layers inside the carousel div below.
    <section
      className="relative w-full py-16 sm:py-20"
      aria-label={heading?.title ?? slides[activeIndex].title}
    >
      {heading && (
        // Same `.container` used by Testimonials' <section className="container ...">
        // so the eyebrow/title/description line up on the same left/right
        // edge as the testimonials heading, instead of sitting flush at 0.
        <div className="container">
          <SectionHeading
            index={heading.index}
            eyebrow={heading.eyebrow}
            title={heading.title}
            description={heading.description}
            as="h3"
          />
        </div>
      )}

      <div
        className={cn(
          // Intentionally NOT wrapped in .container — the carousel stays
          // full-bleed (edge-to-edge video/image), only the heading above
          // it aligns to the container grid.
          "relative hidden h-[520px] w-full overflow-hidden bg-ink-800 md:block",
          heading && "mt-8",
          className
        )}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        role="region"
        aria-roledescription="carousel"
        aria-label={slides[activeIndex].title}
      >
        {/* Canvas layer — crossfading video or image background */}
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

        {/* Top-shadow — legibility gradient so card headers read over bright footage */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-60 bg-gradient-to-b from-black/65 to-transparent" />

        {/* Prev / next controls */}
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

        {/* Menu layer — full-height nav cards; click swaps the active background */}
        <div
          ref={menuRef}
          role="tablist"
          aria-label="Pilih slide"
          className="no-scrollbar absolute inset-0 z-20 flex overflow-x-auto"
        >
          {slides.map((slide, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-current={isActive}
                onClick={() => goTo(i)}
                className={cn(
                  "group relative flex h-full w-1/4 min-w-[210px] shrink-0 flex-col justify-between border-l border-white/10 px-5 py-6 text-left transition-colors duration-300 first:border-l-0",
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
                      className="progress-fill absolute -bottom-2 left-0 h-0.5 w-full origin-left bg-accent"
                      style={{ ["--progress-duration" as string]: `${autoPlayMs}ms` }}
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
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
