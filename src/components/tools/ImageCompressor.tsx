"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";
import { Download, Loader2 } from "lucide-react";
import { ToolShell, toolButton, toolInput, toolLabel } from "./ToolShell";
import { ImagePicker, downloadBlob, formatBytes } from "./ImagePicker";

export default function ImageCompressor() {
  const [original, setOriginal] = useState<File | null>(null);
  const [result, setResult] = useState<File | null>(null);
  const [quality, setQuality] = useState(0.7);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(file: File) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const out = await imageCompression(file, {
        initialQuality: quality,
        // Two reasons, and both are the enforcing CSP in next.config.ts:
        //   - the default spawns a blob worker, and there is no `worker-src`,
        //     so `default-src 'self'` refuses it;
        //   - the worker is loaded from jsdelivr via the `libURL` option, and
        //     `connect-src` does not list that host.
        // With this false the whole thing runs on the main thread, no fetch.
        useWebWorker: false,
      });
      setResult(out);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not compress that file.");
    } finally {
      setBusy(false);
    }
  }

  const saved =
    original && result ? Math.round((1 - result.size / original.size) * 100) : null;

  return (
    <ToolShell
      error={error}
      note="Runs on the main thread, so a very large file will pause the page briefly."
    >
      <ImagePicker
        onFile={(f) => {
          setOriginal(f);
          void run(f);
        }}
      />

      <div>
        <label className={toolLabel} htmlFor="quality">
          Quality — {Math.round(quality * 100)}%
        </label>
        <input
          id="quality"
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={quality}
          onChange={(e) => setQuality(Number(e.target.value))}
          onMouseUp={() => original && void run(original)}
          onTouchEnd={() => original && void run(original)}
          className="w-full"
        />
      </div>

      {busy && (
        <p className="flex items-center gap-2 text-sm text-ink-400">
          <Loader2 size={15} className="animate-spin" />
          Compressing…
        </p>
      )}

      {original && (
        <dl className={`${toolInput} grid grid-cols-3 gap-2 text-sm`}>
          <div>
            <dt className="text-ink-400">Before</dt>
            <dd>{formatBytes(original.size)}</dd>
          </div>
          <div>
            <dt className="text-ink-400">After</dt>
            <dd>{result ? formatBytes(result.size) : "—"}</dd>
          </div>
          <div>
            <dt className="text-ink-400">Saved</dt>
            <dd>{saved === null ? "—" : `${saved}%`}</dd>
          </div>
        </dl>
      )}

      {result && (
        <button
          type="button"
          className={toolButton}
          onClick={() => downloadBlob(result, `compressed-${result.name}`)}
        >
          <Download size={15} />
          Download
        </button>
      )}
    </ToolShell>
  );
}
