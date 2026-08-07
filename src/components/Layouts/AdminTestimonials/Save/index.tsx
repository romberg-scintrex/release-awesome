"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { createTestimonial } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";

const input =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:border-white/10 dark:bg-ink-800";

export function SaveTestimonial() {
  const router = useRouter();
  const [quote, setQuote] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function add() {
    setError(null);
    if (!quote.trim() || !name.trim()) {
      setError("Quote and name are required.");
      return;
    }
    startTransition(async () => {
      const res = await createTestimonial({
        quote: quote.trim(),
        name: name.trim(),
        role: role.trim(),
        published: true,
        sortOrder: 0,
        avatarURL: null
      });
      if (!res.ok) {
        setError(res.error ?? "Could not add.");
        return;
      }
      setQuote("");
      setName("");
      setRole("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-dashed border-black/15 bg-white/50 p-4 dark:border-white/15 dark:bg-white/[0.02]">
      <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-ink-400">Add testimonial</h2>
      <textarea
        rows={2}
        value={quote}
        onChange={(e) => setQuote(e.target.value)}
        className={cn(input, "mt-3 resize-y")}
        placeholder="What they said…"
      />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input className={input} value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role / company" />
      </div>
      {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
      <button
        type="button"
        onClick={add}
        disabled={pending}
        className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink-950 px-3.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-ink-950"
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        Add
      </button>
    </div>
  );
}
