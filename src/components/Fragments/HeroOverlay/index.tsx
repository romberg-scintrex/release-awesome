"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowDown, ArrowUpRight, Download } from "lucide-react";
import {
  GithubIcon,
  LinkedinIcon,
  FacebookIcon,
  InstagramIcon,
} from "@/components/Elements/Icons";
import { Button } from "@/components/Elements/Button";
import { scrollWindowTo } from "@/components/Elements/ScrollSmooth";
import { useSettings } from "@/components/Elements/Providers/SettingsProvider";
import { ROLES } from "@/lib/utils";

export function HeroOverlay() {
  const prefersReducedMotion = useReducedMotion();
  const settings = useSettings();

  const SOCIALS = [
    { href: settings.social.github, label: "GitHub", Icon: GithubIcon },
    { href: settings.social.linkedin, label: "LinkedIn", Icon: LinkedinIcon },
    { href: settings.social.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: settings.social.instagram, label: "Instagram", Icon: InstagramIcon },
  ];

  // Split the name: first word is firstName, the rest carries the violet underline
  const nameWords = settings.name.trim().split(/\s+/);
  const firstName = nameWords[0];
  const lastName = nameWords.length > 1 ? nameWords.slice(1).join(" ") : null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col">
      {/* ── TOP HALF: intentionally empty — let the artwork breathe ─── */}
      <div className="flex-1" />

      {/* Editorial vertical SCROLL label, anchored to the right edge */}
      <motion.div
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute right-3 sm:right-5 bottom-32 sm:bottom-40 flex items-center gap-2 origin-center [writing-mode:vertical-rl] rotate-180 text-[10px] uppercase tracking-[0.32em] text-ink-700/70 dark:text-white/50 pointer-events-auto cursor-pointer"
        onClick={() => scrollWindowTo(window.innerHeight)}
      >
        <motion.span
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block"
        >
          <ArrowDown size={11} className="rotate-180" />
        </motion.span>
        <span>Scroll to explore</span>
      </motion.div>

      {/* ── CENTER MOUSE SCROLL INDICATOR (Desktop Only) ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-28 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2 pointer-events-auto cursor-pointer"
        onClick={() => scrollWindowTo(window.innerHeight)}
      >
        <div className="w-[22px] h-[34px] rounded-full border-[1.5px] border-ink-900/30 dark:border-white/30 flex justify-center p-[3px]">
          <motion.div
            animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-2 rounded-full bg-ink-900/50 dark:bg-white/50"
          />
        </div>
        <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-ink-900/40 dark:text-white/40">
          Scroll down
        </span>
      </motion.div>

      {/* ── BOTTOM RAIL ─────────────────────────────────────────────── */}
      <div className="container relative pb-6 sm:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto relative grid items-center gap-4 rounded-2xl border border-black/10 bg-white/65 px-4 py-2.5 backdrop-blur-2xl shadow-[0_18px_40px_-22px_rgba(0,0,0,0.35)] sm:grid-cols-[1fr_auto] sm:gap-6 sm:px-5 sm:py-3 dark:bg-white"
        >
          {/* Eyebrow + name lockup + animated role — eyebrow sits inline with
              the name to keep the rail short */}
          <div className="min-w-0">
            <h1 className="flex items-baseline gap-2.5">
              <span className="font-display text-[1.35rem] font-black leading-none tracking-[-0.02em] text-ink-950 lg:text-[1.5rem]">
                {firstName}
                {lastName && (
                  <>
                    {" "}
                    <span className="relative inline-block pb-0.5">
                      {lastName}
                      <motion.svg
                        initial={{ pathLength: prefersReducedMotion ? 1 : 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.2, delay: 1.15, ease: [0.22, 1, 0.36, 1] }}
                        aria-hidden="true"
                        viewBox="0 0 418 22"
                        className="absolute -bottom-0.5 left-0 h-[0.24em] w-[102%] -rotate-1 drop-shadow-sm"
                        preserveAspectRatio="none"
                        fill="none"
                      >
                        <defs>
                          <linearGradient id="heroRailUnderline" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="70%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="transparent" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M4 16C120 6 280 4 414 12"
                          stroke="url(#heroRailUnderline)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          className="opacity-90"
                        />
                        <path
                          d="M10 18C130 8 270 6 405 14"
                          stroke="url(#heroRailUnderline)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          className="opacity-40"
                        />
                      </motion.svg>
                    </span>
                  </>
                )}
              </span>
              <span className="sr-only">
                {" "}
                - {settings.role}{" "}| Go &amp; Next JS developer in Jakarta, Indonesia
              </span>
            </h1>
            <div className="mt-1 flex items-baseline gap-2 truncate">
              <RoleTypewriter />
              <span aria-hidden className="hidden sm:inline-block text-ink-400">·</span>
              <span className="hidden sm:inline-block truncate text-sm text-ink-500">
                {settings.university}
              </span>
            </div>
          </div>

          {/* Socials + CTAs */}
          <div className="flex items-center gap-2">
            <div className="mr-1 flex items-center gap-3 text-ink-400">
              {SOCIALS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="transition-colors hover:text-ink-900"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
            <span aria-hidden className="mr-1 hidden h-5 w-px bg-black/10 sm:block" />
            <Link href="/projects" className="flex-1 sm:flex-initial">
              <Button variant="primary" size="sm" data-cursor="view" className="w-full sm:w-auto dark:border dark:border-black/10 dark:hover:bg-black/5">
                View work
                <ArrowUpRight size={15} />
              </Button>
            </Link>
            <a href={settings.cvURL ?? "/cv.pdf"} download data-track="cv" className="flex-1 sm:flex-initial">
              <Button
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto dark:text-ink-950 dark:border-black/10 dark:hover:bg-black/5"
              >
                <Download size={14} />
                Resume
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function RoleTypewriter() {
  return (
    <span
      role="img"
      className="relative inline-flex h-6 overflow-hidden align-baseline"
      aria-label={ROLES.join(", ")}
    >
      <span
        aria-hidden
        className="role-roll flex flex-col"
        // CSS-driven roll (see .role-roll in globals.css) — loops reliably on the
        // compositor. The trailing duplicate of ROLES[0] makes the wrap seamless.
        style={{ "--role-rh": "1.5rem", "--role-dur": "10s" } as CSSProperties}
      >
        {ROLES.map((role) => (
          <span
            key={role}
            className="block h-6 leading-6 text-sm sm:text-base font-semibold text-gradient"
          >
            {role}
          </span>
        ))}
        <span className="block h-6 leading-6 text-sm sm:text-base font-semibold text-gradient">
          {ROLES[0]}
        </span>
      </span>
    </span>
  );
}
