"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Eye, EyeOff, Loader2, Save } from "lucide-react";
import type { BlogPost } from "@/lib/types";
import type { BlogInput } from "@/lib/admin/types";
import { createBlog, updateBlog } from "@/app/admin/action";
import { MediaUpload } from "@/components/Fragments/MediaUpload";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/slug";

const input =
  "h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:border-white/10 dark:bg-ink-800";
const labelCls = "mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-ink-400";
const card = "rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-ink-900";


/**
 * Editor for a per-tenant post in `blogs`.
 *
 * There is deliberately no tags, featured or sort-order control: `blogs` has no
 * such columns. `publishedAt` is shown read-only because the action owns it -
 * the client clock is not trustworthy for a value that orders public content,
 * and setBlogPublished toggles publication without passing through this form.
 */
export function BlogForm({
  initial,
  userId,
}: Readonly<{ initial?: BlogPost; userId: string }>) {
  const router = useRouter();
  const editing = Boolean(initial);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(editing);
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(initial?.coverUrl ?? null);
  const [published, setPublished] = useState(initial?.published ?? false);

  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onTitle(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: BlogInput = {
      slug: slug.trim(),
      title: title.trim(),
      summary,
      content,
      coverUrl,
      published,
      // Read-only here; the action decides. Sent so create can stamp a first
      // publish without a second round trip.
      publishedAt: initial?.publishedAt ?? null,
    };

    const res = editing ? await updateBlog(initial!.id, payload) : await createBlog(payload);
    setSaving(false);

    if (!res.ok) {
      setError(res.error ?? "Could not save this post.");
      return;
    }
    router.push("/admin/blog");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className={card}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="title">Title</label>
            <input
              id="title"
              className={input}
              value={title}
              onChange={(e) => onTitle(e.target.value)}
              required
            />
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
            <p className="mt-1.5 text-xs text-ink-400">
              Unique within your own posts only.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label className={labelCls} htmlFor="summary">Summary</label>
          <textarea
            id="summary"
            rows={2}
            className={cn(input, "h-auto resize-y py-2")}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Shown in the post list."
          />
        </div>

        <div className="mt-4">
          <MediaUpload
            label="Cover image"
            value={coverUrl}
            onChange={setCoverUrl}
            userId={userId}
          />
        </div>
      </div>

      <div className={card}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <label className={cn(labelCls, "mb-0")} htmlFor="content">
            Content — Markdown
          </label>
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            aria-pressed={preview}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-black/10 px-2.5 text-xs font-medium text-ink-500 transition-colors hover:text-ink-950 dark:border-white/10 dark:hover:text-white"
          >
            {preview ? <EyeOff size={13} /> : <Eye size={13} />}
            {preview ? "Edit" : "Preview"}
          </button>
        </div>

        {preview ? (
          <div
            className={cn(
              "prose prose-neutral dark:prose-invert max-w-none",
              "prose-headings:font-display prose-headings:tracking-tight",
              "prose-a:text-[rgb(var(--accent))]",
              "min-h-[18rem] rounded-xl border border-black/10 p-4 dark:border-white/10",
            )}
          >
            {content.trim() ? (
              <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {content}
              </Markdown>
            ) : (
              <p className="text-sm text-ink-400">Nothing to preview yet.</p>
            )}
          </div>
        ) : (
          <textarea
            id="content"
            rows={18}
            className={cn(input, "h-auto resize-y py-3 font-mono text-[13px] leading-relaxed")}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="# Heading&#10;&#10;Write in Markdown. GitHub-flavoured tables and code fences work."
          />
        )}
      </div>

      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
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

          <p className="text-xs text-ink-400">
            Published{" "}
            {initial?.publishedAt
              ? new Date(initial.publishedAt).toLocaleDateString()
              : "— set automatically on first publish"}
          </p>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink-950 px-5 text-sm font-medium text-white transition-colors hover:bg-ink-800 disabled:opacity-60 dark:bg-white dark:text-ink-950 dark:hover:bg-ink-100"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? "Saving…" : editing ? "Save changes" : "Create post"}
      </button>
    </form>
  );
}
