"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2, Eye, EyeOff } from "lucide-react";
import type { Testimonial } from "@/lib/types";
import { updateTestimonial, deleteTestimonial } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";

const input =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:border-white/10 dark:bg-ink-800";

export function TestimonialRowWithActions({ item }: { item: Testimonial }) {
  const router = useRouter();
  const [quote, setQuote] = useState(item.quote);
  const [name, setName] = useState(item.name);
  const [role, setRole] = useState(item.role);
  const [published, setPublished] = useState(item.published);
  const [sortOrder, setSortOrder] = useState(String(item.sortOrder));
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const dirty =
    quote !== item.quote ||
    name !== item.name ||
    role !== item.role ||
    published !== item.published ||
    Number(sortOrder) !== item.sortOrder;

  function save() {
    startTransition(async () => {
      const res = await updateTestimonial(item.id, {
        quote,
        name,
        role,
        published,
        sortOrder: Number(sortOrder) || 0,
        avatarURL: null
      });
      if (res && !res.ok) {
        window.alert(res.error ?? "Could not save this testimonial.");
        return;
      }
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteTestimonial(item.id);
      if (res && !res.ok) {
        window.alert(res.error ?? "Could not delete this testimonial.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-ink-900">
      <textarea
        rows={3}
        value={quote}
        onChange={(e) => setQuote(e.target.value)}
        className={cn(input, "resize-y")}
        placeholder="Quote"
      />
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_5rem]">
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input className={input} value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role / company" />
        <input className={input} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} type="number" placeholder="#" />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setPublished((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
            published
              ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "border-black/10 text-ink-400 dark:border-white/10",
          )}
        >
          {published ? <Eye size={13} /> : <EyeOff size={13} />}
          {published ? "Published" : "Hidden"}
        </button>

        <div className="flex items-center gap-1.5">
          {confirming ? (
            <>
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="inline-flex h-8 items-center gap-1 rounded-lg bg-rose-500 px-2.5 text-xs font-medium text-white disabled:opacity-60"
              >
                {pending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="inline-flex h-8 items-center rounded-lg border border-black/10 px-2.5 text-xs font-medium text-ink-500 dark:border-white/10"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-ink-400 transition-colors hover:text-rose-500 dark:border-white/10"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={pending || !dirty}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-ink-950 px-3 text-xs font-medium text-white disabled:opacity-40 dark:bg-white dark:text-ink-950"
          >
            {pending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
