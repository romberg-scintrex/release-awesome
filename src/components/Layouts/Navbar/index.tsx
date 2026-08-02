"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "../../Elements/ThemeToggle";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
];

export function Navbar() {
  const pathname = usePathname();
  const { scrollY, scrollYProgress } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(latest > 8);
    if (latest > 80 && latest > previous) setHidden(true);
    else setHidden(false);
  });

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <motion.header
        initial={{ y: 0 }}
        animate={{ y: hidden ? -120 : 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-4 z-50 flex justify-center px-4"
      >
        <nav
          aria-label="Primary"
          className={cn(
            "relative flex items-center gap-1 rounded-full border border-black/10",
            "bg-white/65 backdrop-blur-2xl text-ink-900",
            "dark:bg-white dark:border-white/20 dark:shadow-[0_10px_40px_-18px_rgba(0,0,0,0.5)]",
            "shadow-[0_10px_40px_-18px_rgba(0,0,0,0.35)]",
            "h-13 px-1.5 sm:pl-2 sm:pr-1.5",
            "transition-all duration-300",
            scrolled &&
              "shadow-[0_14px_50px_-22px_rgba(0,0,0,0.55)] bg-white/80 dark:bg-white",
          )}
          style={{ height: 52 }}
        >
          {/* Links */}
          <div
            className="hidden md:flex items-center relative"
            onMouseLeave={() => setHoveredHref(null)}
          >
            {NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const isHovered = hoveredHref === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => setHoveredHref(item.href)}
                  className={cn(
                    "relative inline-flex h-9 items-center rounded-full px-3.5 text-sm font-medium",
                    "transition-colors duration-200",
                    active
                      ? "text-ink-950"
                      : "text-ink-500 hover:text-ink-950",
                  )}
                >
                  {/* Hover pill — sits behind links, follows cursor */}
                  {isHovered && !active && (
                    <motion.span
                      layoutId="nav-hover"
                      transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.6 }}
                      className="absolute inset-0 rounded-full bg-black/[0.04]"
                    />
                  )}
                  {/* Active pill */}
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-full bg-ink-950"
                    />
                  )}
                  <span className={cn("relative", active && "text-white")}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-black/[0.05] hover:text-ink-950"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-1 pl-1">
            <ThemeToggle />

            {/* Vertical divider */}
            <div
              aria-hidden
              className="hidden sm:block h-6 w-px bg-black/10 mx-1"
            />

            {/* Inline CTA */}
            <Link
              href="/contact"
              className={cn(
                "inline-flex group items-center gap-1.5 h-9 rounded-full pl-3.5 pr-2 text-xs font-semibold",
                "bg-black text-white",
                "shadow-[0_8px_20px_-10px_rgba(0,0,0,0.55)]",
                "transition-transform duration-200 hover:-translate-y-0.5",
              )}
            >
              Let&apos;s talk
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-transform duration-200 group-hover:rotate-45">
                <ArrowUpRight size={12} />
              </span>
            </Link>
          </div>

          {/* Scroll-progress thread along the bottom edge of the pill */}
          <motion.span
            aria-hidden
            style={{ scaleX: scrollYProgress }}
            className="pointer-events-none absolute inset-x-5 -bottom-px h-[1.5px] origin-left rounded-full bg-gradient-to-r from-brand-violet via-brand-fuchsia to-brand-rose opacity-70"
          />

          {/* Mobile dropdown menu */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                key="mobile-menu"
                initial={{ opacity: 0, y: -8, scale: 0.98, x: "-50%" }}
                animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                exit={{ opacity: 0, y: -8, scale: 0.98, x: "-50%" }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="md:hidden absolute left-1/2 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] origin-top rounded-2xl border border-black/10 bg-white/90 p-1.5 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.45)] backdrop-blur-2xl dark:bg-white/95 dark:border-white/20"
              >
                {NAV.map((item) => {
                  const active =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-11 items-center rounded-xl px-3.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-ink-950 text-white"
                          : "text-ink-700 hover:bg-black/[0.05] hover:text-ink-950",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </motion.header>
  );
}
