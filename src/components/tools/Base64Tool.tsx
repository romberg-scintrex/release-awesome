"use client";

import { useState } from "react";
import { ToolShell, toolButton, toolInput, toolLabel } from "./ToolShell";

/**
 * UTF-8 safe, which btoa alone is not: it throws on any code point above 0xFF.
 * Encoding through TextEncoder first is what makes "é" or an emoji work.
 */
export function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  // A loop rather than String.fromCharCode(...bytes): spreading a large array
  // overflows the call stack.
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export function decodeBase64(value: string): string {
  const binary = atob(value.trim());
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export default function Base64Tool() {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function apply(fn: (v: string) => string) {
    setError(null);
    if (!text) return setError("Nothing to convert.");
    try {
      setText(fn(text));
    } catch {
      setError("That is not valid Base64.");
    }
  }

  return (
    <ToolShell error={error} note="UTF-8 safe in both directions, including emoji.">
      <div>
        <label className={toolLabel} htmlFor="b64">Text</label>
        <textarea
          id="b64"
          rows={10}
          className={toolInput}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={toolButton} onClick={() => apply(encodeBase64)}>
          Encode
        </button>
        <button type="button" className={toolButton} onClick={() => apply(decodeBase64)}>
          Decode
        </button>
      </div>
    </ToolShell>
  );
}
