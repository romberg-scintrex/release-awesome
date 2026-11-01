"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { GalleryItem } from "@/lib/types";
import { MediaUpload } from "@/components/Fragments/MediaUpload";
import { cn } from "@/lib/utils";

const input =
  "h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:border-white/10 dark:bg-ink-800";
const labelCls = "mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-ink-400";

/**
 * Controlled editor for a project's `gallery` JSONB array.
 *
 * Fully controlled - it keeps no state of its own, so the parent form owns the
 * value and there is no second copy to drift. Order matters, since the gallery
 * renders in array order, which is why move-up/down exist rather than relying
 * on sort fields the column does not have.
 */
export function GalleryEditor({
  items,
  onChange,
  userId,
}: Readonly<{
  items: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
  /** Storage path prefix for uploads; see MediaUpload. */
  userId: string;
}>) {
  function patch(index: number, next: Partial<GalleryItem>) {
    onChange(items.map((it, i) => (i === index ? { ...it, ...next } : it)));
  }

  function add() {
    onChange([...items, { type: "image", url: "", caption: "" }]);
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div>
      <label className={labelCls}>Gallery</label>

      {items.length === 0 && (
        <p className="text-sm text-ink-400">
          No items yet. The first image doubles as the project&apos;s lead visual.
        </p>
      )}

      <ul className="space-y-3">
        {items.map((item, i) => (
          <li
            key={i}
            className="rounded-xl border border-black/10 p-3 dark:border-white/10"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-ink-400">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={`Move item ${i + 1} up`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-ink-400 transition-colors enabled:hover:text-ink-950 disabled:opacity-40 dark:border-white/10 dark:enabled:hover:text-white"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  aria-label={`Move item ${i + 1} down`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-ink-400 transition-colors enabled:hover:text-ink-950 disabled:opacity-40 dark:border-white/10 dark:enabled:hover:text-white"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`Remove item ${i + 1}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-ink-400 transition-colors hover:text-rose-500 dark:border-white/10"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[7rem_1fr]">
              <div>
                <label className={labelCls} htmlFor={`gallery-${i}-type`}>
                  Type
                </label>
                <select
                  id={`gallery-${i}-type`}
                  className={input}
                  value={item.type}
                  onChange={(e) =>
                    patch(i, { type: e.target.value as GalleryItem["type"] })
                  }
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor={`gallery-${i}-caption`}>
                  Caption
                </label>
                <input
                  id={`gallery-${i}-caption`}
                  className={input}
                  value={item.caption ?? ""}
                  onChange={(e) => patch(i, { caption: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="mt-3">
              <MediaUpload
                label={item.type === "video" ? "Video file" : "Image file"}
                value={item.url || null}
                onChange={(url) => patch(i, { url: url ?? "" })}
                userId={userId}
                accept={item.type === "video" ? "video/*" : "image/*"}
                preview={item.type === "video" ? "file" : "image"}
              />
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={add}
        className={cn(
          "mt-3 inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium",
          "border-black/10 text-ink-600 transition-colors",
          "hover:border-accent/50 hover:text-accent dark:border-white/10 dark:text-ink-300",
        )}
      >
        <Plus size={15} />
        Add gallery item
      </button>
    </div>
  );
}
