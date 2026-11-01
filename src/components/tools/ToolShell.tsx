"use client";

import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const toolInput =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2 font-mono text-[13px] leading-relaxed focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:border-white/10 dark:bg-ink-800";
export const toolLabel =
  "mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-ink-400";
export const toolButton =
  "inline-flex h-9 items-center gap-1.5 rounded-xl border border-black/10 px-3 text-sm font-medium text-ink-600 transition-colors hover:border-accent/50 hover:text-accent dark:border-white/10 dark:text-ink-300";

/**
 * Shared frame for the embedded tools.
 *
 * Every one of them runs entirely in the browser and sends nothing anywhere,
 * which is worth saying once here rather than in five slightly different
 * wordings.
 */
export function ToolShell({
  children,
  note,
  error,
}: Readonly<{ children: ReactNode; note?: ReactNode; error?: string | null }>) {
  return (
    <div className="space-y-4">
      {note && (
        <p className="text-sm leading-relaxed text-ink-500 dark:text-ink-300">{note}</p>
      )}

      {children}

      {error && (
        <p
          role="alert"
          className={cn(
            "flex items-start gap-2 rounded-xl border px-3 py-2 text-sm",
            "border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-300",
          )}
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span className="font-mono text-[13px]">{error}</span>
        </p>
      )}

      <p className="text-xs text-ink-400">
        Runs entirely in your browser. Nothing you type is sent anywhere.
      </p>
    </div>
  );
}
