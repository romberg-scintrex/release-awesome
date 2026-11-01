"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { ToolShell, toolButton, toolInput, toolLabel } from "./ToolShell";
import { downloadBlob } from "./ImagePicker";

/** Higher levels survive more damage at the cost of density. */
const LEVELS = ["L", "M", "Q", "H"] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_NOTE: Record<Level, string> = {
  L: "~7% recoverable",
  M: "~15% recoverable",
  Q: "~25% recoverable",
  H: "~30% recoverable",
};

export default function QrCodeGenerator() {
  const [text, setText] = useState("");
  const [level, setLevel] = useState<Level>("M");
  const [dataUrl, setDataUrl] = useState("");
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Derived rather than cleared from the effect: an empty input has nothing to
  // show, which is knowable at render time. Clearing it through setState is a
  // wasted render and what react-hooks/set-state-in-effect flags.
  const shownPng = text ? dataUrl : "";
  const shownSvg = text ? svg : "";

  useEffect(() => {
    if (!text) return;
    let cancelled = false;
    const opts = { errorCorrectionLevel: level, margin: 2, width: 512 } as const;
    Promise.all([QRCode.toDataURL(text, opts), QRCode.toString(text, { ...opts, type: "svg" })])
      .then(([png, vector]) => {
        if (cancelled) return;
        setDataUrl(png);
        setSvg(vector);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          // Chiefly: too much data for any version at this level.
          setError(err instanceof Error ? err.message : "Could not encode that.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [text, level]);

  return (
    <ToolShell error={error} note="Encodes any text — a URL, a Wi-Fi string, a vCard.">
      <div>
        <label className={toolLabel} htmlFor="qr-text">Content</label>
        <textarea
          id="qr-text"
          rows={4}
          className={toolInput}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
        />
      </div>

      <div>
        <label className={toolLabel} htmlFor="qr-level">Error correction</label>
        <select
          id="qr-level"
          className={toolInput}
          value={level}
          onChange={(e) => setLevel(e.target.value as Level)}
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l} — {LEVEL_NOTE[l]}
            </option>
          ))}
        </select>
      </div>

      {shownPng && (
        <>
          <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shownPng} alt="The generated QR code" className="mx-auto h-48 w-48" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={toolButton}
              onClick={async () => {
                const blob = await (await fetch(shownPng)).blob();
                downloadBlob(blob, "qr-code.png");
              }}
            >
              <Download size={15} />
              PNG
            </button>
            <button
              type="button"
              className={toolButton}
              onClick={() =>
                downloadBlob(new Blob([shownSvg], { type: "image/svg+xml" }), "qr-code.svg")
              }
            >
              <Download size={15} />
              SVG
            </button>
          </div>
        </>
      )}
    </ToolShell>
  );
}
