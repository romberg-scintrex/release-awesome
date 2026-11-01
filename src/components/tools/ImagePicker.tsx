"use client";

import { useRef, type ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { toolButton, toolLabel } from "./ToolShell";

/** Human-readable byte count, for before/after comparisons. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Loads a File into an HTMLImageElement via an object URL.
 *
 * The URL is revoked on both paths - a leaked object URL pins the whole decoded
 * bitmap in memory for the life of the document, which matters in a tool
 * someone may use on a dozen files in a row.
 */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be decoded as an image."));
    };
    img.src = url;
  });
}

/** Triggers a download without leaving a dangling object URL behind. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ImagePicker({
  label = "Image",
  accept = "image/*",
  onFile,
}: Readonly<{
  label?: string;
  accept?: string;
  onFile: (file: File) => void;
}>) {
  const ref = useRef<HTMLInputElement>(null);

  function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div>
      <span className={toolLabel}>{label}</span>
      <input
        ref={ref}
        type="file"
        accept={accept}
        onChange={pick}
        className="sr-only"
        aria-label={label}
      />
      <button type="button" className={toolButton} onClick={() => ref.current?.click()}>
        <Upload size={15} />
        Choose a file
      </button>
    </div>
  );
}
