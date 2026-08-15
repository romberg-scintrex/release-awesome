"use client";

import { useState, type ChangeEvent } from "react";
import { Upload, X, Loader2, FileText } from "lucide-react";
import { uploadFile } from "@/lib/admin/upload";

interface MediaUploadProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  accept?: string;
  preview?: "image" | "file" | "none";
  hint?: string;
}

export function MediaUpload({
  label,
  value,
  onChange,
  folder,
  accept = "image/*",
  preview = "image",
  hint,
}: MediaUploadProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadFile(file, folder);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-ink-400">
        {label}
      </label>

      {preview === "image" && value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className="mb-2 h-28 w-full rounded-xl border border-black/10 object-cover dark:border-white/10"
        />
      )}
      {preview === "file" && value && (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="mb-2 inline-flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-sm text-ink-600 hover:text-ink-950 dark:border-white/10 dark:text-ink-300 dark:hover:text-white"
        >
          <FileText size={15} />
          View current file
        </a>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="https://… or upload"
          className="h-10 flex-1 rounded-xl border border-black/10 bg-white px-3 text-sm focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:border-white/10 dark:bg-ink-800"
        />
        <label className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/10 dark:bg-ink-800 dark:hover:bg-white/5">
          <input type="file" accept={accept} hidden onChange={onFile} disabled={busy} />
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          Upload
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 text-ink-400 transition-colors hover:text-rose-500 dark:border-white/10"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {hint && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-rose-500">{error}</p>}
    </div>
  );
}
