"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Save, Star } from "lucide-react";
import { PROJECT_CATEGORIES, type GalleryItem, type Project, type ProjectCategory } from "@/lib/types";
import type { ProjectInput } from "@/lib/admin/types";
import { createProject, updateProject } from "@/app/admin/action";
import { MediaUpload } from "@/components/Fragments/MediaUpload";
import { GalleryEditor } from "@/components/Fragments/GalleryEditor";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/slug";

const input =
  "h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:border-white/10 dark:bg-ink-800";
const labelCls = "mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-ink-400";
const card = "rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-ink-900";

/** Same set ToolForm offers, so the two surfaces stay visually consistent. */
const GRADIENTS = [
  "from-brand-cyan via-brand-violet to-brand-fuchsia",
  "from-brand-violet via-brand-fuchsia to-brand-rose",
  "from-brand-emerald via-brand-cyan to-brand-violet",
  "from-brand-amber via-brand-rose to-brand-fuchsia",
  "from-brand-fuchsia via-brand-violet to-brand-cyan",
  "from-brand-rose via-brand-amber to-brand-emerald",
];


export function ProjectForm({
  initial,
  userId,
}: Readonly<{ initial?: Project; userId: string }>) {
  const router = useRouter();
  const editing = Boolean(initial);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(editing);
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription ?? "");
  const [longDescription, setLongDescription] = useState(initial?.longDescription ?? "");
  const [categories, setCategories] = useState<ProjectCategory[]>(initial?.categories ?? []);
  // Edited as text, split on save - a tag widget is not worth the weight here.
  const [technologies, setTechnologies] = useState((initial?.technologies ?? []).join(", "));
  const [year, setYear] = useState(String(initial?.year ?? new Date().getFullYear()));
  const [gallery, setGallery] = useState<GalleryItem[]>(initial?.gallery ?? []);
  const [thumbnailURL, setThumbnailURL] = useState<string | null>(initial?.thumbnailURL ?? null);
  const [liveURL, setLiveURL] = useState(initial?.liveURL ?? "");
  const [githubURL, setGithubURL] = useState(initial?.githubURL ?? "");
  const [linkedinURL, setLinkedinURL] = useState(initial?.linkedinURL ?? "");
  const [gradient, setGradient] = useState(initial?.gradient ?? GRADIENTS[0]);
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [published, setPublished] = useState(initial?.published ?? false);
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onTitle(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function toggleCategory(c: ProjectCategory) {
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: ProjectInput = {
      slug: slug.trim(),
      title: title.trim(),
      shortDescription,
      longDescription,
      categories,
      technologies: technologies
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      year: Number(year) || new Date().getFullYear(),
      featured,
      published,
      gallery: gallery.filter((g) => g.url.trim()),
      thumbnailURL,
      liveURL: liveURL.trim() || null,
      githubURL: githubURL.trim() || null,
      linkedinURL: linkedinURL.trim() || null,
      gradient,
      sortOrder: Number(sortOrder) || 0,
    };

    const res = editing
      ? await updateProject(initial!.id, payload)
      : await createProject(payload);
    setSaving(false);

    if (!res.ok) {
      setError(res.error ?? "Could not save this project.");
      return;
    }
    router.push("/admin/projects");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className={card}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="title">Title</label>
            <input id="title" className={input} value={title} onChange={(e) => onTitle(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls} htmlFor="slug">Slug</label>
            <input
              id="slug"
              className={input}
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              required
            />
          </div>
        </div>

        <div className="mt-4">
          <label className={labelCls} htmlFor="shortDescription">Short description</label>
          <textarea
            id="shortDescription"
            rows={2}
            className={cn(input, "h-auto resize-y py-2")}
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <label className={labelCls} htmlFor="longDescription">Long description</label>
          <textarea
            id="longDescription"
            rows={6}
            className={cn(input, "h-auto resize-y py-2")}
            value={longDescription}
            onChange={(e) => setLongDescription(e.target.value)}
          />
        </div>
      </div>

      <div className={card}>
        <fieldset>
          <legend className={labelCls}>Categories</legend>
          <div className="flex flex-wrap gap-2">
            {PROJECT_CATEGORIES.map((c) => {
              const on = categories.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCategory(c)}
                  aria-pressed={on}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    on
                      ? "border-accent/50 bg-accent/10 text-accent"
                      : "border-black/10 text-ink-500 hover:text-ink-950 dark:border-white/10 dark:hover:text-white",
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_6rem_6rem]">
          <div>
            <label className={labelCls} htmlFor="technologies">Technologies</label>
            <input
              id="technologies"
              className={input}
              value={technologies}
              onChange={(e) => setTechnologies(e.target.value)}
              placeholder="Comma separated"
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="year">Year</label>
            <input id="year" type="number" className={input} value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="sortOrder">Order</label>
            <input id="sortOrder" type="number" className={input} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </div>
        </div>
      </div>

      <div className={card}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls} htmlFor="liveURL">Live URL</label>
            <input id="liveURL" className={input} value={liveURL} onChange={(e) => setLiveURL(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="githubURL">GitHub URL</label>
            <input id="githubURL" className={input} value={githubURL} onChange={(e) => setGithubURL(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="linkedinURL">LinkedIn URL</label>
            <input id="linkedinURL" className={input} value={linkedinURL} onChange={(e) => setLinkedinURL(e.target.value)} />
          </div>
        </div>

        <div className="mt-4">
          <label className={labelCls} htmlFor="gradient">Gradient</label>
          <select id="gradient" className={input} value={gradient} onChange={(e) => setGradient(e.target.value)}>
            {GRADIENTS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <div className={cn("mt-2 h-2 rounded-full bg-gradient-to-r", gradient)} aria-hidden />
        </div>

        <div className="mt-4">
          <MediaUpload label="Thumbnail" value={thumbnailURL} onChange={setThumbnailURL} userId={userId} />
        </div>
      </div>

      <div className={card}>
        <GalleryEditor items={gallery} onChange={setGallery} userId={userId} />
      </div>

      <div className={card}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPublished((v) => !v)}
            aria-pressed={published}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
              published
                ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "border-black/10 text-ink-400 dark:border-white/10",
            )}
          >
            {published ? <Eye size={13} /> : <EyeOff size={13} />}
            {published ? "Published" : "Draft"}
          </button>
          <button
            type="button"
            onClick={() => setFeatured((v) => !v)}
            aria-pressed={featured}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
              featured
                ? "border-amber-500/40 text-amber-600 dark:text-amber-400"
                : "border-black/10 text-ink-400 dark:border-white/10",
            )}
          >
            <Star size={13} />
            {featured ? "Featured" : "Not featured"}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink-950 px-5 text-sm font-medium text-white transition-colors hover:bg-ink-800 disabled:opacity-60 dark:bg-white dark:text-ink-950 dark:hover:bg-ink-100"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? "Saving…" : editing ? "Save changes" : "Create project"}
      </button>
    </form>
  );
}
