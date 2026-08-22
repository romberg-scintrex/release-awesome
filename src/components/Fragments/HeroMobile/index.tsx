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
import type { Profile } from "@/lib/types";

const LIGHT_STAGE =
  "radial-gradient(ellipse 120% 80% at 50% 22%, #fcfbf6 0%, #f6f4ed 42%, #ece7d8 78%, #e2dbc7 100%)";
// Deep emerald-ink stage for dark mode
const DARK_STAGE =
  "radial-gradient(ellipse 130% 95% at 52% 16%, #062319 0%, #041a13 38%, #02100b 72%, #010906 100%)";

const ease = [0.16, 1, 0.3, 1] as const;

export function MobileHero({
  className,
  profile,
}: Readonly<{ className?: string; profile?: Profile }>) {
  const reduce = useReducedMotion();
  const globalSettings = useSettings();

  // Memakai data profile tenant jika dikirim, fallback ke global settings jika undefined
  const name = profile?.name ?? globalSettings.name;
  const role = profile?.role ?? globalSettings.role;
  const heroMobileURL =
    profile?.heroMobileURL ?? globalSettings.heroMobileURL ?? "/images/p3.webp";
  const cvURL = profile?.cvURL ?? globalSettings.cvURL ?? "/cv.pdf";

  const social = {
    github: profile?.social?.github ?? globalSettings.social.github,
    linkedin: profile?.social?.linkedin ?? globalSettings.social.linkedin,
    facebook: profile?.social?.facebook ?? globalSettings.social.facebook,
    instagram: profile?.social?.instagram ?? globalSettings.social.instagram,
  };

  // Split name: first word is firstName, the rest carries the emerald underline
  const nameWords = name.trim().split(/\s+/);
  const firstName = nameWords[0];
  const lastName = nameWords.length > 1 ? nameWords.slice(1).join(" ") : null;
  const initial = name.charAt(0).toUpperCase();

  const SOCIALS = [
    { href: social.github, label: "GitHub", Icon: GithubIcon },
    { href: social.linkedin, label: "LinkedIn", Icon: LinkedinIcon },
    { href: social.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: social.instagram, label: "Instagram", Icon: InstagramIcon },
  ];

  return (
    <section
      className={cn(
        "relative flex min-h-[100svh] flex-col overflow-hidden bg-[#f3efe4] dark:bg-[#010906]",
        className,
      )}
    >
      {/* themed stage — cream in light, deep emerald-ink in dark */}
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
        className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-24 bg-gradient-to-b from-[#fcfbf6] to-transparent dark:from-[#010906]"
      />

      {/* key light — soft emerald glow behind the head */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[12%] z-[1] h-[72vw] w-[72vw] max-h-[28rem] max-w-[28rem] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[90px] dark:bg-emerald-400/15"
        animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ── BIG INITIAL "K" behind the figure — faint on light, glowing emerald outline on dark ─ */}
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
        {/* dark — subtle emerald stroke and enhanced glow */}
        <span
          className="hidden font-display font-black uppercase leading-[0.74] tracking-[-0.07em] text-transparent dark:block"
          style={{
            fontSize: "clamp(22rem, 112vw, 40rem)",
            WebkitTextStroke: "3px rgba(52,211,153,0.7)",
            filter: "drop-shadow(0 0 25px rgba(16,185,129,0.4)) drop-shadow(0 0 65px rgba(52,211,153,0.2))",
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
          src={heroMobileURL}
          alt={`${name} - ${role}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover [filter:contrast(1.05)_saturate(1.04)] drop-shadow-[0_30px_44px_rgba(4,26,19,0.42)]"
          style={{ objectPosition: "40% 6%" }}
        />
      </motion.div>

      {/* ── SCROLL INDICATOR ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute left-1/2 z-20 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-1"
        style={{ top: "50.5%" }}
        onClick={() => scrollWindowTo(window.innerHeight)}
      >
        <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-ink-900/40 dark:text-emerald-200/50">
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
            className="text-ink-900/40 dark:text-emerald-200/50"
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
            "radial-gradient(115% 78% at 50% 28%, transparent 52%, rgba(2,16,11,0.25) 100%)",
        }}
      />

      {/* floor scrim — figure dissolves; name gets a readable base */}
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
            "linear-gradient(to top, #010906 0%, #010906 25%, rgba(1,9,6,0.95) 45%, transparent 100%)",
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
          className="font-display font-black leading-[0.84] tracking-[-0.035em] text-ink-950 dark:text-emerald-50 [text-shadow:0_1px_0_rgba(255,255,255,0.7)] dark:[text-shadow:none]"
          style={{ fontSize: "clamp(3rem, 15vw, 4.5rem)" }}
        >
          {firstName}
          <br />
          {lastName && (
            <span className="relative inline-block pb-2">
              {lastName}
              <motion.svg
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden="true"
                viewBox="0 0 418 22"
                className="absolute -bottom-1 left-0 h-[0.28em] w-[102%] -rotate-1 drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]"
                preserveAspectRatio="none"
                fill="none"
              >
                <defs>
                  <linearGradient id="fadeGradientEmerald" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="currentColor" className="text-emerald-500 dark:text-emerald-400" />
                    <stop offset="70%" stopColor="currentColor" className="text-emerald-500 dark:text-emerald-400" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                {/* Main thick stroke with gradient fade */}
                <path
                  d="M4 16C120 6 280 4 414 12"
                  stroke="url(#fadeGradientEmerald)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className="opacity-90"
                />
                {/* Subtle secondary stroke */}
                <path
                  d="M10 18C130 8 270 6 405 14"
                  stroke="url(#fadeGradientEmerald)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="opacity-40"
                />
              </motion.svg>
            </span>
          )}
        </motion.h1>

        {/* rail — socials + actions */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.66, ease }}
          className="mt-5 rounded-[20px] border border-black/10 bg-white/70 px-4 py-3 shadow-[0_18px_44px_-22px_rgba(0,0,0,0.4)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              <RoleTypewriter />
            </div>
            <div className="flex items-center gap-3 text-ink-400 dark:text-emerald-200/60">
              {SOCIALS.map(({ href, label, Icon }) =>
                href ? (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="transition-colors hover:text-ink-900 dark:hover:text-emerald-100"
                  >
                    <Icon size={16} />
                  </a>
                ) : null
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Link href="/projects" className="flex-1">
              <Button variant="primary" size="sm" className="w-full border border-black/10 dark:border-white/10">
                View work
                <ArrowUpRight size={15} />
              </Button>
            </Link>
            <a href={cvURL} download data-track="cv" className="flex-1">
              <Button variant="ghost" size="sm" className="w-full border border-black/10 dark:border-white/10 dark:text-emerald-100 dark:hover:bg-white/10">
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