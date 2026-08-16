"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─── Module-level singleton ────────────────────────────────────────────────────
// A single Lenis instance is shared across the entire app; multiple instances
// on the same page fight over the scroll axis and produce jank.
let lenisInstance: Lenis | null = null;

type ScrollProgressListener = (progress: number) => void;
const scrollProgressListeners = new Set<ScrollProgressListener>();

/**
 * Custom event dispatched after Lenis has processed its first tick AND
 * ScrollTrigger.refresh() has run. Components that register a ScrollTrigger
 * before Lenis mounts (e.g. ScrollyTelling on /about) must listen for this
 * to re-sync their pinned scroll distances.
 */
export const LENIS_READY_EVENT = "lenis:ready" as const;

function readScrollProgress(): number {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? window.scrollY / max : 0;
}

/**
 * Subscribe to normalized page-scroll progress (0 → 1).
 * Returns an unsubscribe function — always call it on cleanup.
 *
 * Falls back to native scroll events when Lenis hasn't mounted yet (e.g.
 * during SSR hydration or when `prefers-reduced-motion` is set).
 */
export function subscribeScrollProgress(listener: ScrollProgressListener): () => void {
  scrollProgressListeners.add(listener);

  if (typeof window !== "undefined") {
    listener(readScrollProgress());
  }

  if (!lenisInstance) {
    const onScroll = () => listener(readScrollProgress());
    const onResize = () => listener(readScrollProgress());
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      scrollProgressListeners.delete(listener);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }

  return () => scrollProgressListeners.delete(listener);
}

/** Smooth-scroll to a Y position — uses Lenis when active, native otherwise. */
export function scrollWindowTo(top: number): void {
  if (lenisInstance) {
    lenisInstance.scrollTo(top);
  } else {
    window.scrollTo({ top, behavior: "smooth" });
  }
}

/**
 * Lenis + GSAP ScrollTrigger — single integrated scroll engine.
 *
 * Integration strategy (Lenis v1.1+ / GSAP 3.12+):
 *
 * 1. Lenis runs on the GSAP ticker (same rAF frame as ScrollTrigger), so
 *    both systems advance in lockstep on every frame.
 * 2. Every Lenis "scroll" event calls ScrollTrigger.update() so scrub/pin
 *    calculations fire immediately — not deferred to a native "scroll" event.
 * 3. lagSmoothing(0) prevents GSAP from skipping ticks after long frames,
 *    which would let Lenis's eased position drift from ScrollTrigger's
 *    last-read value.
 * 4. NO scrollerProxy — Lenis v1.1+ writes its eased position directly to
 *    window.scrollY via the native scroll API, so ScrollTrigger reads the
 *    correct value without a proxy shim.
 * 5. Dispatches LENIS_READY_EVENT after the first rAF so that any
 *    ScrollTrigger registered before Lenis mounted can call
 *    ScrollTrigger.refresh() at the right moment.
 */
export function ScrollSmooth() {
  const prefersReducedMotion = useReducedMotion();
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  // ── Mount / unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    // Honour prefers-reduced-motion: Lenis is not started, page scrolls natively.
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      // Allow nested scroll containers (e.g. modals, code blocks) to scroll
      // without Lenis intercepting and preventing their events.
      allowNestedScroll: true,
    });
    lenisInstance = lenis;

    // ── Ticker bridge ─────────────────────────────────────────────────────
    // Drive Lenis from GSAP's ticker so both advance in the same rAF frame.
    // GSAP passes time in seconds; Lenis.raf() expects milliseconds.
    const lenisTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(lenisTick);
    gsap.ticker.lagSmoothing(0);

    // ── ScrollTrigger sync ─────────────────────────────────────────────────
    // Force ScrollTrigger to recalculate after every Lenis frame so that
    // scrub animations and pin positions stay in sync with the eased scroll.
    const onLenisScroll = ({ progress }: { progress: number }) => {
      scrollProgressListeners.forEach((fn) => fn(progress));
      ScrollTrigger.update();
    };
    lenis.on("scroll", onLenisScroll);

    // ── Notify dependents ──────────────────────────────────────────────────
    // Components that registered a ScrollTrigger before this effect ran
    // (child effects fire before parent effects) must re-sync their positions
    // after Lenis has processed its first tick. Two rAF frames:
    //   frame 1 — Lenis processes first tick, takes ownership of scrollY
    //   frame 2 — ScrollTrigger.refresh() reads the final layout
    let rafId: number;
    const scheduleReady = () => {
      rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(() => {
          ScrollTrigger.refresh();
          window.dispatchEvent(new CustomEvent(LENIS_READY_EVENT));
        });
      });
    };
    scheduleReady();

    return () => {
      cancelAnimationFrame(rafId);
      gsap.ticker.remove(lenisTick);
      lenis.off("scroll", onLenisScroll);
      lenis.destroy();
      lenisInstance = null;
    };
  }, [prefersReducedMotion]);

  // ── Route change ───────────────────────────────────────────────────────────
  // On navigation: snap to top immediately (no smooth scroll between pages)
  // then let ScrollTrigger recalculate positions for the new page layout.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    lenisInstance?.scrollTo(0, { immediate: true, force: true });
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [pathname]);

  return null;
}
