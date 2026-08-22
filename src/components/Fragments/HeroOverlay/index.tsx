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
import type { Profile } from "@/lib/types";

interface HeroOverlayProps {
  profile?: Profile;
}

export function HeroOverlay({ profile }: HeroOverlayProps) {
  const prefersReducedMotion = useReducedMotion();
  const settings = useSettings();

  // Memakai data profile tenant jika dikirim, fallback ke global settings
  const githubURL = profile?.social?.github ?? settings.social.github;
  const linkedinURL = profile?.social?.linkedin ?? settings.social.linkedin;
  const facebookURL = profile?.social?.facebook ?? settings.social.facebook;
  const instagramURL = profile?.social?.instagram ?? settings.social.instagram;
  const fullName = profile?.name ?? settings.name;
  const university = profile?.university ?? settings.university;
  const cvURL = profile?.cvURL ?? settings.cvURL ?? "/cv.pdf";

  const SOCIALS = [
    { href: githubURL, label: "GitHub", Icon: GithubIcon },
    { href: linkedinURL, label: "LinkedIn", Icon: LinkedinIcon },
    { href: facebookURL, label: "Facebook", Icon: FacebookIcon },
    { href: instagramURL, label: "Instagram", Icon: InstagramIcon },
  ];

  // Split nama: kata pertama firstName, sisanya lastName dengan efek underline gradien
  const nameWords = fullName.trim().split(/\s+/);
  const firstName = nameWords[0];
  const lastName = nameWords.length > 1 ? nameWords.slice(1).join(" ") : null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col">
      {/* ── TOP HALF: Area transparan agar visual canvas/artwork bernapas ─── */}
      <div className="flex-1" />

      {/* Label SCROLL vertikal di kanan */}
      <motion.div
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute right-3 sm:right-5 bottom-32 sm:bottom-40 flex items-center gap-2 origin-center [writing-mode:vertical-rl] rotate-180 text-[10px] uppercase tracking-[0.32em] text-[rgb(var(--muted))] pointer-events-auto cursor-pointer hover:text-[rgb(var(--fg))] transition-colors"
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

      {/* ── SCROLL MOUSE INDICATOR (Desktop Only) ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-28 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2 pointer-events-auto cursor-pointer"
        onClick={() => scrollWindowTo(window.innerHeight)}
      >
        <div className="w-[22px] h-[34px] rounded-full border-[1.5px] border-black/20 dark:border-white/20 flex justify-center p-[3px]">
          <motion.div
            animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-2 rounded-full bg-[rgb(var(--fg))/0.4]"
          />
        </div>
        <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
          Scroll down
        </span>
      </motion.div>

      {/* ── BOTTOM RAIL (MENGGUNAKAN CLASS .glass-strong DARI CSS) ──────────────── */}
      <div className="container relative pb-6 sm:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="glass-strong pointer-events-auto relative grid items-center gap-4 rounded-2xl px-4 py-2.5 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.35)] sm:grid-cols-[1fr_auto] sm:gap-6 sm:px-5 sm:py-3"
        >
          {/* Eyebrow + Name lockup + Animated role */}
          <div className="min-w-0">
            <h1 className="flex items-baseline gap-2.5">
              <span className="font-display text-[1.35rem] font-black leading-none tracking-[-0.02em] text-[rgb(var(--fg))] lg:text-[1.5rem]">
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
                          {/* Gradien diselaraskan dengan tema Emerald/Teal/Cyan globals.css */}
                          <linearGradient id="heroRailUnderline" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#059669" />
                            <stop offset="50%" stopColor="#059669" />
                            <stop offset="85%" stopColor="#059669" />
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
            </h1>
            <div className="mt-1 flex items-baseline gap-2 truncate">
              <RoleTypewriter />
              <span aria-hidden className="hidden sm:inline-block text-[rgb(var(--muted))]">·</span>
              <span className="hidden sm:inline-block truncate text-sm text-[rgb(var(--muted))]">
                {university}
              </span>
            </div>
          </div>

          {/* Socials + CTAs */}
          <div className="flex items-center gap-2">
            <div className="mr-1 flex items-center gap-3 text-[rgb(var(--muted))]">
              {SOCIALS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="transition-colors hover:text-[rgb(var(--fg))]"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
            <span aria-hidden className="mr-1 hidden h-5 w-px bg-black/10 dark:bg-white/10 sm:block" />
            <Link href="/projects" className="flex-1 sm:flex-initial">
              <Button variant="primary" size="sm" data-cursor="view" className="btn-sheen w-full sm:w-auto">
                View work
                <ArrowUpRight size={15} />
              </Button>
            </Link>
            <a href={cvURL} download data-track="cv" className="flex-1 sm:flex-initial">
              <Button
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto text-[rgb(var(--fg))]"
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
      className="relative inline-flex h-6 overflow-hidden align-baseline"
      aria-label={ROLES.join(", ")}
    >
      <span
        aria-hidden
        className="role-roll flex flex-col"
        style={
          {
            "--role-rh": "24px",
            "--role-dur": `${ROLES.length * 2.5}s`,
          } as CSSProperties
        }
      >
        {ROLES.map((role, idx) => (
          <span
            key={`${role}-${idx}`}
            className="block h-6 whitespace-nowrap text-sm font-semibold leading-6 text-gradient sm:text-base"
          >
            {role}
          </span>
        ))}
        {/* Item duplikat di akhir untuk animasi seamless wrap */}
        <span className="block h-6 whitespace-nowrap text-sm font-semibold leading-6 text-gradient sm:text-base">
          {ROLES[0]}
        </span>
      </span>
    </span>
  );
}