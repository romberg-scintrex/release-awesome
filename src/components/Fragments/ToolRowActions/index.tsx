"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, Trash2, Loader2 } from "lucide-react";
import { setToolPublished, deleteTool } from "@/app/admin/action";
import { cn } from "@/lib/utils";

export function ToolRowActions({ id, published }: { id: string; published: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function togglePublish() {
    startTransition(async () => {
      const res = await setToolPublished(id, !published);
      if (res && !res.ok) {
        window.alert(res.error ?? "Could not update visibility.");
        return;
      }
      router.refresh();
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      const res = await deleteTool(id);
      if (res && !res.ok) {
        window.alert(res.error ?? "Could not delete this tool.");
        return;
      }
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={confirmDelete}
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
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={togglePublish}
        disabled={pending}
        title={published ? "Unpublish" : "Publish"}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
          published
            ? "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
            : "border-black/10 text-ink-400 hover:text-ink-950 dark:border-white/10 dark:hover:text-white",
        )}
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : published ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        title="Delete"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-ink-400 transition-colors hover:text-rose-500 dark:border-white/10"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
