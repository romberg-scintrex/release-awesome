"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Download } from "lucide-react";
import type { CSSProperties } from "react";
import {
  GithubIcon,
  LinkedinIcon,
  FacebookIcon,
  InstagramIcon,
} from "@/components/Elements/Icons";
import { Button } from "@/components/Elements/Button";
import { scrollWindowTo } from "@/components/Elements/ScrollSmooth";
import { useSettings } from "@/components/Elements/Providers/SettingsProvider";
import { cn, ROLES } from "@/lib/utils";

const LIGHT_STAGE =
  "radial-gradient(ellipse 120% 80% at 50% 22%, #fcfbf6 0%, #f6f4ed 42%, #ece7d8 78%, #e2dbc7 100%)";
// subtle purple-black stage for dark mode
const DARK_STAGE =
  "radial-gradient(ellipse 130% 95% at 52% 16%, #1c162b 0%, #110d1c 38%, #0a0812 72%, #07060f 100%)";

const ease = [0.16, 1, 0.3, 1] as const;

export function MobileHero({ className }: Readonly<{ className?: string }>) {
  const reduce = useReducedMotion();
  const settings = useSettings();

  // Split name: first word is firstName, the rest carries the violet underline
  const nameWords = settings.name.trim().split(/\s+/);
  const firstName = nameWords[0];
  const lastName = nameWords.length > 1 ? nameWords.slice(1).join(" ") : null;
  const initial = settings.name.charAt(0).toUpperCase();

  const SOCIALS = [
    { href: settings.social.github, label: "GitHub", Icon: GithubIcon },
    { href: settings.social.linkedin, label: "LinkedIn", Icon: LinkedinIcon },
    { href: settings.social.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: settings.social.instagram, label: "Instagram", Icon: InstagramIcon },
  ];

  return (
    <section
      className={cn(
        "relative flex min-h-[100svh] flex-col overflow-hidden bg-[#f3efe4] dark:bg-[#07060f]",
        className,
      )}
    >
      {/* themed stage — cream in light, deep purple-ink in dark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 dark:opacity-0"
        style={{ background: LIGHT_STAGE }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-0 dark:opacity-100"
        style={{ background: DARK_STAGE }}
      />

      {/* calm top band so the floating nav has air */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-24 bg-gradient-to-b from-[#fcfbf6] to-transparent dark:from-[#07060f]"
      />

      {/* key light — soft glow behind the head */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[12%] z-[1] h-[72vw] w-[72vw] max-h-[28rem] max-w-[28rem] -translate-x-1/2 rounded-full bg-brand-violet/20 blur-[90px] dark:bg-white/10"
        animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ── BIG "K" behind the figure — faint on light, glowing neon on dark ─ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 z-[3] flex select-none justify-center"
        style={{ top: "13%", transform: "translateX(-8%)" }}
      >
        {/* light — faint filled letterform */}
        <span
          className="font-display font-black uppercase leading-[0.74] tracking-[-0.07em] text-ink-900/[0.06] dark:hidden"
          style={{ fontSize: "clamp(24rem, 110vw, 38rem)" }}
        >
          {initial}
        </span>
        {/* dark — subtle white stroke and enhanced glow */}
        <span
          className="hidden font-display font-black uppercase leading-[0.74] tracking-[-0.07em] text-transparent dark:block"
          style={{
            fontSize: "clamp(22rem, 112vw, 40rem)",
            WebkitTextStroke: "4px rgba(255,255,255,0.9)",
            filter: "drop-shadow(0 0 25px rgba(255,255,255,0.55)) drop-shadow(0 0 65px rgba(255,255,255,0.35))",
          }}
        >
          {initial}
        </span>
      </div>

      {/* ── FULL-BLEED FIGURE — taller, sits behind the name cluster ────── */}
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 1.03 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.1, ease }}
        className="pointer-events-none absolute inset-x-0 z-10"
        style={{ top: "0", bottom: "0" }}
      >
        <Image
          src={settings.heroMobileURL ?? "/images/p3.webp"}
          alt={`${settings.name} - ${settings.role}`}
          fill
          priority
          sizes="100vw"
          className="object-cover [filter:contrast(1.05)_saturate(1.04)] drop-shadow-[0_30px_44px_rgba(18,10,38,0.42)]"
          style={{ objectPosition: "40% 6%" }}
        />
      </motion.div>

      {/* ── SCROLL INDICATOR ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 cursor-pointer"
        style={{ top: "50.5%" }}
        onClick={() => scrollWindowTo(window.innerHeight)}
      >
        <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-ink-900/40 dark:text-white/40">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-ink-900/40 dark:text-white/40"
          >
            <path
              d="M1 1L5 5L9 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </motion.div>

      {/* edge vignette — frames the figure */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[11]"
        style={{
          background:
            "radial-gradient(115% 78% at 50% 28%, transparent 52%, rgba(10,8,22,0.20) 100%)",
        }}
      />

      {/* floor scrim — figure dissolves; name gets a readable base (themed, inline gradients) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[12] dark:opacity-0"
        style={{
          height: "64%",
          background:
            "linear-gradient(to top, #f3efe4 0%, rgba(243,239,228,0.9) 45%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[12] opacity-0 dark:opacity-100"
        style={{
          height: "64%",
          background:
            "linear-gradient(to top, #07060f 0%, #07060f 25%, rgba(7,6,15,0.95) 45%, transparent 100%)",
        }}
      />

      {/* film grain over everything */}
      <div className="noise pointer-events-none absolute inset-0 z-[14]" aria-hidden />

      {/* ── NAME CLUSTER (overlaps figure) + RAIL ──────────────────────── */}
      <div className="relative z-20 mt-auto px-5 pb-11">
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.46, ease }}
          className="font-display font-black leading-[0.84] tracking-[-0.035em] text-ink-950 dark:text-white [text-shadow:0_1px_0_rgba(255,255,255,0.7)] dark:[text-shadow:none]"
          style={{ fontSize: "clamp(3rem, 15vw, 4.5rem)" }}
        >
          {firstName}
          <br />
          <span className="relative inline-block pb-2">
            {lastName}
            <motion.svg
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
              aria-hidden="true"
              viewBox="0 0 418 22"
              className="absolute -bottom-1 left-0 w-[102%] h-[0.28em] -rotate-1 drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(139,92,246,0.8)]"
              preserveAspectRatio="none"
              fill="none"
            >
              <defs>
                <linearGradient id="fadeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="currentColor" className="text-violet-500 dark:text-violet-400" />
                  <stop offset="70%" stopColor="currentColor" className="text-violet-500 dark:text-violet-400" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
              {/* Main thick stroke with gradient fade */}
              <path
                d="M4 16C120 6 280 4 414 12"
                stroke="url(#fadeGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                className="opacity-90"
              />
              {/* Subtle secondary stroke */}
              <path
                d="M10 18C130 8 270 6 405 14"
                stroke="url(#fadeGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                className="opacity-40"
              />
            </motion.svg>
          </span>
          <span className="sr-only">
            {" "}
            - {settings.role}{" "}| Go &amp; Next.js developer in Jakarta, Indonesia
          </span>
        </motion.h1>

        {/* role + tagline */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.56, ease }}
          className="mt-3"
        >
          <p className="max-w-[20rem] text-sm leading-relaxed text-ink-500 dark:text-ink-300">
            {settings.role}{" "}| Go &amp; Next.js developer in Jakarta, Indonesia
          </p>
        </motion.div>

        {/* rail — socials + actions (CV / View work kept functional) */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.66, ease }}
          className="mt-5 rounded-[20px] border border-black/10 bg-white/65 px-4 py-3 shadow-[0_18px_44px_-22px_rgba(0,0,0,0.4)] backdrop-blur-2xl dark:bg-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-violet" />
              <RoleTypewriter />
            </div>
            <div className="flex items-center gap-3 text-ink-400">
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
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Link href="/projects" className="flex-1">
              <Button variant="primary" size="sm" className="w-full dark:border dark:border-black/10 dark:hover:bg-black/5">
                View work
                <ArrowUpRight size={15} />
              </Button>
            </Link>
            <a href={settings.cvURL ?? "/cv.pdf"} download data-track="cv" className="flex-1">
              <Button variant="ghost" size="sm" className="w-full dark:text-ink-950 dark:border-black/10 dark:hover:bg-black/5">
                <Download size={14} />
                Resume
              </Button>
            </a>
          </div>
        </motion.div>
      </div>

      {/* bottom fade into the next section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-20 bg-gradient-to-b from-transparent to-[rgb(var(--bg))]" />
    </section>
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
        style={{ "--role-rh": "1.5rem", "--role-dur": "10s" } as CSSProperties}
      >
        {ROLES.map((role) => (
          <span
            key={role}
            className="block h-6 whitespace-nowrap text-[15px] font-bold leading-6 text-gradient-strong"
          >
            {role}
          </span>
        ))}
        <span className="block h-6 whitespace-nowrap text-[15px] font-bold leading-6 text-gradient-strong">
          {ROLES[0]}
        </span>
      </span>
    </span>
  );
}
