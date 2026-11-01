"use client";

import { useState } from "react";
import { ToolShell, toolButton, toolInput, toolLabel } from "./ToolShell";

export default function UrlEncoder() {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function apply(fn: (v: string) => string) {
    setError(null);
    if (!text) return setError("Nothing to convert.");
    try {
      setText(fn(text));
    } catch {
      // decodeURIComponent throws URIError on a stray or truncated %-escape.
      setError("That contains an invalid percent-escape.");
    }
  }

  return (
    <ToolShell
      error={error}
      note={
        <>
          <strong>Component</strong> encodes <code>/</code>, <code>?</code> and{" "}
          <code>&amp;</code> — use it for one query value. <strong>Full URI</strong>{" "}
          leaves them alone, so a whole URL survives.
        </>
      }
    >
      <div>
        <label className={toolLabel} htmlFor="url">Text</label>
        <textarea
          id="url"
          rows={8}
          className={toolInput}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={toolButton} onClick={() => apply(encodeURIComponent)}>
          Encode component
        </button>
        <button type="button" className={toolButton} onClick={() => apply(decodeURIComponent)}>
          Decode component
        </button>
        <button type="button" className={toolButton} onClick={() => apply(encodeURI)}>
          Encode full URI
        </button>
        <button type="button" className={toolButton} onClick={() => apply(decodeURI)}>
          Decode full URI
        </button>
      </div>
    </ToolShell>
  );
}
