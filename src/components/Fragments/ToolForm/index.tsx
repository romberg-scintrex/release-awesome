"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Tool, ToolKind } from "@/lib/types";
import type { ToolInput } from "@/lib/admin/types";
import { createTool, updateTool } from "@/app/admin/action";
import { TOOL_COMPONENTS } from "@/lib/tools/registry";
import { MediaUpload } from "@/components/Fragments/MediaUpload";
import { cn } from "@/lib/utils";

const GRADIENTS = [
  "from-brand-cyan via-brand-violet to-brand-fuchsia",
  "from-brand-violet via-brand-fuchsia to-brand-rose",
  "from-brand-emerald via-brand-cyan to-brand-violet",
  "from-brand-amber via-brand-rose to-brand-fuchsia",
  "from-brand-fuchsia via-brand-violet to-brand-cyan",
  "from-brand-rose via-brand-amber to-brand-emerald",
];

const input =
  "h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:border-white/10 dark:bg-ink-800";
const labelCls = "mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-ink-400";
const card =
  "rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-ink-900";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ToolForm({ initial, userId }: { initial?: Tool; userId: string }) {
  const router = useRouter();
  const editing = Boolean(initial);

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(editing);
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Utility");
  const [iconUrl, setIconUrl] = useState<string | null>(initial?.icon ?? null);
  const [coverUrl, setCoverUrl] = useState<string | null>(initial?.coverURL ?? null);
  const [gradient, setGradient] = useState(initial?.gradient ?? GRADIENTS[0]);
  const [kind, setKind] = useState<ToolKind>(initial?.kind ?? "embedded");
  const [componentKey, setComponentKey] = useState(
    initial?.componentKey ?? TOOL_COMPONENTS[0]?.key ?? "",
  );
  const [externalUrl, setExternalUrl] = useState(initial?.externalUrl ?? "");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [published, setPublished] = useState(initial?.published ?? false);
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onNameChange(v: string) {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Name is required.");
    const finalSlug = (slug || slugify(name)).trim();
    if (!finalSlug) return setError("Slug is required.");
    if (kind === "embedded" && !componentKey) return setError("Pick a built-in tool component.");
    if (kind === "external" && !externalUrl.trim())
      return setError("Add the external URL this tool links to.");

    setSaving(true);
    const payload: ToolInput = {
      slug: finalSlug,
      name: name.trim(),
      tagline: tagline.trim(),
      description,
      category: category.trim() || "Utility",
      icon: iconUrl || null,
      coverURL: coverUrl || null,
      gradient,
      kind,
      componentKey: kind === "embedded" ? componentKey : null,
      externalUrl: kind === "external" ? externalUrl.trim() : null,
      featured,
      published,
      sortOrder: Number(sortOrder) || 0,
    };

    const res = editing ? await updateTool(initial!.id, payload) : await createTool(payload);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      setSaving(false);
      return;
    }
    router.push("/admin/tools");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Basics */}
      <div className={card}>
        <h2 className="font-display text-lg font-semibold">Details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="name">Name</label>
            <input id="name" className={input} value={name} onChange={(e) => onNameChange(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="slug">Slug</label>
            <input
              id="slug"
              className={input}
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="category">Category</label>
            <input id="category" className={input} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Image, AI, Text…" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="tagline">Tagline (used on cards &amp; as the meta description)</label>
            <input id="tagline" className={input} value={tagline} onChange={(e) => setTagline(e.target.value)} />
          </div>
        </div>
      </div>

      {/* What it is */}
      <div className={card}>
        <h2 className="font-display text-lg font-semibold">Type</h2>
        <p className="mt-1 text-xs text-ink-400">
          Embedded tools run on your site; external tools link out.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["embedded", "external"] as ToolKind[]).map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => setKind(k)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm capitalize transition-colors",
                kind === k
                  ? "border-transparent bg-ink-950 text-white dark:bg-white dark:text-ink-950"
                  : "border-black/15 text-ink-500 hover:text-ink-950 dark:border-white/15 dark:hover:text-white",
              )}
            >
              {k}
            </button>
          ))}
        </div>

        {kind === "embedded" ? (
          <div className="mt-4">
            <label className={labelCls} htmlFor="component">Built-in tool component</label>
            <select
              id="component"
              className={input}
              value={componentKey}
              onChange={(e) => setComponentKey(e.target.value)}
            >
              {TOOL_COMPONENTS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-ink-400">
              {TOOL_COMPONENTS.find((c) => c.key === componentKey)?.description}
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <label className={labelCls} htmlFor="external">External URL</label>
            <input id="external" className={input} value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://…" />
          </div>
        )}
      </div>

      {/* Description */}
      <div className={card}>
        <h2 className="font-display text-lg font-semibold">Description</h2>
        <p className="mt-1 text-xs text-ink-400">Markdown - shown on the tool page.</p>
        <textarea
          className={cn(input, "mt-4 h-auto py-3 font-mono text-[13px] leading-relaxed")}
          rows={10}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={"What the tool does, who it's for, and how to use it…"}
        />
      </div>

      {/* Appearance */}
      <div className={card}>
        <h2 className="font-display text-lg font-semibold">Appearance</h2>
        <div className="mt-4 space-y-5">
          <MediaUpload
            label="Tool icon (marquee & logo)"
            value={iconUrl}
            onChange={setIconUrl}
            userId={userId}
            accept="image/*"
            hint="Upload a square icon/logo (e.g. 48×48 or SVG/PNG)."
          />
          <MediaUpload
            label="Cover image (card + social preview)"
            value={coverUrl}
            onChange={setCoverUrl}
            userId={userId}
            accept="image/*"
            hint="Optional. 1200×630 works well. Falls back to the gradient below."
          />
          <div>
            <label className={labelCls}>Card gradient (fallback behind cover)</label>
            <div className="flex flex-wrap gap-2">
              {GRADIENTS.map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setGradient(g)}
                  aria-label={g}
                  className={cn(
                    "h-9 w-14 rounded-lg bg-gradient-to-br ring-2 ring-offset-2 ring-offset-white transition dark:ring-offset-ink-900",
                    g,
                    gradient === g ? "ring-ink-950 dark:ring-white" : "ring-transparent",
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Visibility */}
      <div className={card}>
        <h2 className="font-display text-lg font-semibold">Visibility</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls} htmlFor="sort">Sort order</label>
            <input id="sort" type="number" className={input} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </div>
          <label className="flex items-center gap-3 self-end pb-2">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 rounded" />
            <span className="text-sm">Featured</span>
          </label>
          <label className="flex items-center gap-3 self-end pb-2">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 rounded" />
            <span className="text-sm">Published (visible on site)</span>
          </label>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink-950 px-5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 dark:bg-white dark:text-ink-950"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {editing ? "Save changes" : "Create tool"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/tools")}
          className="inline-flex h-11 items-center rounded-xl border border-black/10 px-5 text-sm font-medium text-ink-600 hover:text-ink-950 dark:border-white/10 dark:text-ink-300 dark:hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}