"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import Lenis from "lenis";

// Module singleton so other components (hero scroll buttons, modals) can
// drive or pause the same instance instead of fighting it with native calls.
let lenisInstance: Lenis | null = null;

type ScrollProgressListener = (progress: number) => void;
const scrollProgressListeners = new Set<ScrollProgressListener>();

function readNativeScrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? window.scrollY / max : 0;
}

function notifyScrollProgress(progress: number) {
  scrollProgressListeners.forEach((listener) => listener(progress));
}

/** Subscribe to normalized scroll progress (0–1). Works with or without Lenis. */
export function subscribeScrollProgress(listener: ScrollProgressListener) {
  scrollProgressListeners.add(listener);
  listener(readNativeScrollProgress());

  if (!lenisInstance) {
    const onScroll = () => listener(readNativeScrollProgress());
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      scrollProgressListeners.delete(listener);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }

  return () => scrollProgressListeners.delete(listener);
}

/** Smooth-scroll the window via Lenis when active, native otherwise. */
export function scrollWindowTo(top: number) {
  if (lenisInstance) {
    lenisInstance.scrollTo(top);
  } else {
    window.scrollTo({ top, behavior: "smooth" });
  }
}

/**
 * Buttery wheel scrolling — the signature "Framer site" feel. Touch devices
 * keep native momentum scrolling (Lenis only smooths wheel input by default)
 * and the whole thing is skipped under prefers-reduced-motion. Nested
 * scrollables (tool panes, textareas) keep native wheel via allowNestedScroll;
 * modals can opt out wholesale with data-lenis-prevent.
 */
export function ScrollSmooth() {
  const prefersReducedMotion = useReducedMotion();
  const pathname = usePathname();
  const firstPath = useRef(true);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      allowNestedScroll: true,
    });
    lenisInstance = lenis;

    const onLenisScroll = ({ progress }: { progress: number }) => {
      notifyScrollProgress(progress);
    };
    lenis.on("scroll", onLenisScroll);

    let rafId = requestAnimationFrame(function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    });

    return () => {
      cancelAnimationFrame(rafId);
      lenis.off("scroll", onLenisScroll);
      lenis.destroy();
      lenisInstance = null;
    };
  }, [prefersReducedMotion]);

  // On route change, kill any in-flight inertia and re-sync to the top —
  // otherwise a wheel flick still easing out writes the OLD page's offset
  // back onto the new page (Lenis ignores external scrolls mid-animation).
  // Skipped on first render so browser scroll restoration on reload survives.
  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    lenisInstance?.scrollTo(0, { immediate: true, force: true });
  }, [pathname]);

  return null;
}
