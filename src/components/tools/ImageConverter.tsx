"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { ToolShell, toolButton, toolInput, toolLabel } from "./ToolShell";
import { ImagePicker, downloadBlob, formatBytes, loadImage } from "./ImagePicker";

const FORMATS = [
  { mime: "image/png", label: "PNG", ext: "png" },
  { mime: "image/jpeg", label: "JPEG", ext: "jpg" },
  { mime: "image/webp", label: "WebP", ext: "webp" },
] as const;

export default function ImageConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [mime, setMime] = useState<string>("image/webp");
  const [out, setOut] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function convert(source: File, target: string) {
    setBusy(true);
    setError(null);
    setOut(null);
    try {
      const img = await loadImage(source);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is unavailable in this browser.");
      // JPEG has no alpha; without a white backdrop transparency turns black.
      if (target === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, target, 0.92),
      );
      if (!blob) throw new Error("This browser cannot write that format.");
      setOut(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not convert that file.");
    } finally {
      setBusy(false);
    }
  }

  const ext = FORMATS.find((f) => f.mime === mime)?.ext ?? "png";

  return (
    <ToolShell error={error} note="Converts between PNG, JPEG and WebP using the canvas.">
      <ImagePicker
        onFile={(f) => {
          setFile(f);
          void convert(f, mime);
        }}
      />

      <div>
        <label className={toolLabel} htmlFor="format">Target format</label>
        <select
          id="format"
          className={toolInput}
          value={mime}
          onChange={(e) => {
            setMime(e.target.value);
            if (file) void convert(file, e.target.value);
          }}
        >
          {FORMATS.map((f) => (
            <option key={f.mime} value={f.mime}>{f.label}</option>
          ))}
        </select>
        {mime === "image/jpeg" && (
          <p className="mt-1.5 text-xs text-ink-400">
            JPEG has no transparency — any transparent area becomes white.
          </p>
        )}
      </div>

      {busy && (
        <p className="flex items-center gap-2 text-sm text-ink-400">
          <Loader2 size={15} className="animate-spin" />
          Converting…
        </p>
      )}

      {out && (
        <>
          <p className="text-sm text-ink-500 dark:text-ink-300">
            {formatBytes(out.size)}
          </p>
          <button
            type="button"
            className={toolButton}
            onClick={() => downloadBlob(out, `converted.${ext}`)}
          >
            <Download size={15} />
            Download .{ext}
          </button>
        </>
      )}
    </ToolShell>
  );
}
