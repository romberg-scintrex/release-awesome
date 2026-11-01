"use client";

import { useEffect, useState } from "react";
import { ToolShell, toolInput, toolLabel } from "./ToolShell";

const ALGORITHMS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
type Algorithm = (typeof ALGORITHMS)[number];

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function HashGenerator() {
  const [text, setText] = useState("");
  const [algorithm, setAlgorithm] = useState<Algorithm>("SHA-256");
  const [digest, setDigest] = useState("");
  const [digestError, setDigestError] = useState<string | null>(null);

  // crypto.subtle only exists in a secure context, so it is absent over plain
  // http on a LAN address. Saying so beats a tool that silently does nothing.
  const available = typeof crypto !== "undefined" && Boolean(crypto.subtle);

  // Derived during render rather than set from the effect. Availability is
  // knowable without running anything, and announcing it through setState in an
  // effect is both a wasted render and what react-hooks/set-state-in-effect
  // exists to flag.
  const error = available
    ? digestError
    : "The Web Crypto API needs a secure context. Open this page over HTTPS or on localhost.";

  // Likewise derived: an empty or unavailable state has nothing to display, so
  // clearing the stored digest from the effect would be a second render for a
  // value that is already knowable.
  const shown = available && text ? digest : "";

  useEffect(() => {
    if (!available || !text) return;
    let cancelled = false;
    crypto.subtle
      .digest(algorithm, new TextEncoder().encode(text))
      .then((buf) => {
        if (cancelled) return;
        setDigest(toHex(buf));
        setDigestError(null);
      })
      .catch(() => {
        if (!cancelled) setDigestError(`${algorithm} is not supported in this browser.`);
      });
    return () => {
      cancelled = true;
    };
  }, [text, algorithm, available]);

  return (
    <ToolShell error={error}>
      <div>
        <label className={toolLabel} htmlFor="hash-algo">Algorithm</label>
        <select
          id="hash-algo"
          className={toolInput}
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
        >
          {ALGORITHMS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={toolLabel} htmlFor="hash-input">Text</label>
        <textarea
          id="hash-input"
          rows={8}
          className={toolInput}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
        />
      </div>

      <div>
        <label className={toolLabel} htmlFor="hash-out">Digest</label>
        <output id="hash-out" className={`${toolInput} block break-all`}>
          {shown || "—"}
        </output>
      </div>
    </ToolShell>
  );
}
