"use client";

import { useState } from "react";
import { Download, Link2, Link2Off, Loader2 } from "lucide-react";
import { ToolShell, toolButton, toolInput, toolLabel } from "./ToolShell";
import { ImagePicker, downloadBlob, formatBytes, loadImage } from "./ImagePicker";

export default function ImageResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [locked, setLocked] = useState(true);
  const [out, setOut] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ratio = natural ? natural.w / natural.h : 1;

  async function pick(f: File) {
    setError(null);
    setOut(null);
    setFile(f);
    try {
      const img = await loadImage(f);
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setWidth(String(img.naturalWidth));
      setHeight(String(img.naturalHeight));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that image.");
    }
  }

  // With the lock on, editing one dimension derives the other from the
  // original aspect ratio - not from the current field, which would compound
  // rounding error across edits.
  function onWidth(value: string) {
    setWidth(value);
    if (locked && natural && value) {
      setHeight(String(Math.max(1, Math.round(Number(value) / ratio))));
    }
  }
  function onHeight(value: string) {
    setHeight(value);
    if (locked && natural && value) {
      setWidth(String(Math.max(1, Math.round(Number(value) * ratio))));
    }
  }

  async function resize() {
    if (!file) return;
    const w = Number(width);
    const h = Number(height);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1) {
      setError("Width and height must both be at least 1 pixel.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const img = await loadImage(file);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w);
      canvas.height = Math.round(h);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is unavailable in this browser.");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, file.type || "image/png", 0.92),
      );
      if (!blob) throw new Error("This browser could not write the resized image.");
      setOut(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resize that image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell error={error}>
      <ImagePicker onFile={(f) => void pick(f)} />

      {natural && (
        <p className="text-sm text-ink-400">
          Original: {natural.w} × {natural.h}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label className={toolLabel} htmlFor="w">Width</label>
          <input
            id="w"
            type="number"
            min={1}
            className={toolInput}
            value={width}
            onChange={(e) => onWidth(e.target.value)}
          />
        </div>
        <div>
          <label className={toolLabel} htmlFor="h">Height</label>
          <input
            id="h"
            type="number"
            min={1}
            className={toolInput}
            value={height}
            onChange={(e) => onHeight(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setLocked((v) => !v)}
            aria-pressed={locked}
            aria-label={locked ? "Unlock aspect ratio" : "Lock aspect ratio"}
            className={toolButton}
          >
            {locked ? <Link2 size={15} /> : <Link2Off size={15} />}
            {locked ? "Locked" : "Free"}
          </button>
        </div>
      </div>

      <button type="button" className={toolButton} onClick={() => void resize()} disabled={!file || busy}>
        {busy ? <Loader2 size={15} className="animate-spin" /> : null}
        Resize
      </button>

      {out && (
        <>
          <p className="text-sm text-ink-500 dark:text-ink-300">{formatBytes(out.size)}</p>
          <button
            type="button"
            className={toolButton}
            onClick={() => downloadBlob(out, `resized-${file?.name ?? "image"}`)}
          >
            <Download size={15} />
            Download
          </button>
        </>
      )}
    </ToolShell>
  );
}
