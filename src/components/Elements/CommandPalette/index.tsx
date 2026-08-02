"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  Home,
  User,
  Mail,
  Download,
  Sun,
  Moon,
  Command as CommandIcon,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  type LucideIcon,
} from "lucide-react";
import { GithubIcon, LinkedinIcon, FacebookIcon } from "@/components/Elements/Icons";
import { useSettings } from "@/components/Elements/Providers/SettingsProvider";
import { cn } from "@/lib/utils";
import { notifyCV } from "@/lib/notify-client";

interface Command {
  id: string;
  label: string;
  hint?: string;
  group: "Navigate" | "Actions" | "Social";
  icon: LucideIcon | ((props: { size?: number }) => React.JSX.Element);
  perform: () => void;
  keywords?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const settings = useSettings();

  const close = () => {
    setOpen(false);
    setQuery("");
    setActive(0);
  };

  const go = (href: string) => {
    router.push(href);
    close();
  };

  const commands: Command[] = useMemo(
    () => [
      { id: "home", label: "Home", group: "Navigate", icon: Home, perform: () => go("/"), keywords: "landing main" },
      { id: "about", label: "About", group: "Navigate", icon: User, perform: () => go("/about"), keywords: "bio story me" },
      { id: "contact", label: "Contact", group: "Navigate", icon: Mail, perform: () => go("/contact"), keywords: "email reach" },

      {
        id: "theme",
        label: resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme",
        group: "Actions",
        icon: resolvedTheme === "dark" ? Sun : Moon,
        perform: () => {
          setTheme(resolvedTheme === "dark" ? "light" : "dark");
          close();
        },
        keywords: "appearance mode dark light",
      },
      {
        id: "cv",
        label: "Download CV (PDF)",
        group: "Actions",
        icon: Download,
        perform: () => {
          notifyCV();
          window.open(settings.cvURL ?? "/cv.pdf", "_blank");
          close();
        },
        keywords: "resume pdf download",
      },
      {
        id: "email",
        label: `Email - ${settings.email}`,
        group: "Actions",
        icon: Mail,
        perform: () => {
          window.location.href = `mailto:${settings.email}`;
          close();
        },
        keywords: "contact mail",
      },

      {
        id: "github",
        label: "GitHub",
        hint: "@dimasyudhana",
        group: "Social",
        icon: GithubIcon,
        perform: () => {
          window.open(settings.social.github, "_blank");
          close();
        },
        keywords: "git code repos",
      },
      {
        id: "linkedin",
        label: "LinkedIn",
        group: "Social",
        icon: LinkedinIcon,
        perform: () => {
          window.open(settings.social.linkedin, "_blank");
          close();
        },
      },
      {
        id: "facebook",
        label: "Facebook",
        group: "Social",
        icon: FacebookIcon,
        perform: () => {
          window.open(settings.social.facebook, "_blank");
          close();
        },
      },
    ],
    [resolvedTheme, setTheme, router, settings], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      `${c.label} ${c.group} ${c.keywords ?? ""}`.toLowerCase().includes(q),
    );
  }, [commands, query]);

  // Group filtered commands while preserving order
  const grouped = useMemo(() => {
    const m = new Map<Command["group"], Command[]>();
    for (const c of filtered) {
      if (!m.has(c.group)) m.set(c.group, []);
      m.get(c.group)!.push(c);
    }
    return Array.from(m.entries());
  }, [filtered]);

  // Hotkeys
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isK = e.key === "k" || e.key === "K";
      if (isK && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (!open) return;
      if (e.key === "Tab") {
        // Trap focus within the dialog (aria-modal contract / WCAG 2.4.3).
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const activeEl = document.activeElement as HTMLElement | null;
        if (!activeEl || !panel.contains(activeEl)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && activeEl === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && activeEl === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        filtered[active]?.perform();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, active]);

  // Focus input on open (capturing the opener); restore focus to it on close.
  useEffect(() => {
    if (open) {
      lastFocused.current = (document.activeElement as HTMLElement) ?? null;
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      lastFocused.current?.focus?.();
    }
  }, [open]);
  useEffect(() => {
    setActive(0);
  }, [query]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Auto-scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-cmd-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="cmdk"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          data-lenis-prevent
          className="fixed inset-0 z-[100] flex items-start justify-center bg-ink-950/40 px-4 pt-24 sm:pt-32 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative w-full max-w-xl overflow-hidden rounded-2xl",
              "border border-black/10 dark:border-white/10",
              "bg-white/95 dark:bg-ink-900/95 backdrop-blur-2xl",
              "shadow-[0_30px_80px_-30px_rgba(0,0,0,0.5)]",
            )}
          >
            <div className="flex items-center gap-3 border-b border-black/10 dark:border-white/10 px-4">
              <Search size={16} className="text-ink-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search…"
                className="h-12 w-full bg-transparent text-sm placeholder:text-ink-400 focus:outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-black/10 dark:border-white/15 bg-white/60 dark:bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-ink-500">
                ESC
              </kbd>
            </div>

            <div ref={listRef} data-lenis-prevent className="max-h-[60vh] overflow-y-auto p-1.5">
              {grouped.length === 0 && (
                <div className="px-3 py-10 text-center text-sm text-ink-400">
                  Nothing matches “{query}”.
                </div>
              )}
              {grouped.map(([group, items]) => (
                <div key={group} className="px-1.5 pb-1.5">
                  <div className="px-2.5 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-400">
                    {group}
                  </div>
                  {items.map((c) => {
                    const idx = filtered.indexOf(c);
                    const isActive = idx === active;
                    const Icon = c.icon as LucideIcon;
                    return (
                      <button
                        key={c.id}
                        data-cmd-index={idx}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => c.perform()}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition-colors",
                          isActive
                            ? "bg-black/[0.06] dark:bg-white/[0.08] text-ink-950 dark:text-white"
                            : "text-ink-700 dark:text-ink-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-lg border border-black/10 dark:border-white/10",
                            isActive ? "bg-white dark:bg-white/10" : "bg-white/60 dark:bg-white/5",
                          )}
                        >
                          <Icon size={14} />
                        </span>
                        <span className="flex-1 truncate">{c.label}</span>
                        {c.hint && (
                          <span className="hidden sm:inline-block text-xs text-ink-400">
                            {c.hint}
                          </span>
                        )}
                        {isActive && (
                          <CornerDownLeft size={13} className="text-ink-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] px-3.5 py-2 text-[11px] text-ink-400">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <ArrowUp size={11} /> <ArrowDown size={11} /> to navigate
                </span>
                <span className="inline-flex items-center gap-1">
                  <CornerDownLeft size={11} /> to select
                </span>
              </div>
              <span className="inline-flex items-center gap-1">
                <CommandIcon size={11} /> + K to toggle
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
