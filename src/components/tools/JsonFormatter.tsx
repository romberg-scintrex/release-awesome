"use client";

import { useState } from "react";
import { ToolShell, toolButton, toolInput, toolLabel } from "./ToolShell";

/**
 * V8's own message is already the best available: it names what it expected and
 * appends "at position N (line L column C)" whenever it has a position.
 *
 * An earlier version of this reformatted it to add a line and column, which
 * duplicated what was already there and added nothing for the short-token
 * errors that carry no position at all - `{"a":}` yields
 * `Unexpected token '}', ... is not valid JSON` with no location to extract.
 */
function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export default function JsonFormatter() {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function run(transform: (v: unknown) => string) {
    setError(null);
    if (!text.trim()) {
      setError("Nothing to parse.");
      return;
    }
    try {
      setText(transform(JSON.parse(text)));
    } catch (err) {
      setError(describe(err));
    }
  }

  return (
    <ToolShell error={error} note="Pretty-print, minify, or check that JSON parses.">
      <div>
        <label className={toolLabel} htmlFor="json">JSON</label>
        <textarea
          id="json"
          rows={16}
          className={toolInput}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='{ "paste": "anything" }'
          spellCheck={false}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={toolButton} onClick={() => run((v) => JSON.stringify(v, null, 2))}>
          Pretty-print
        </button>
        <button type="button" className={toolButton} onClick={() => run((v) => JSON.stringify(v))}>
          Minify
        </button>
        <button
          type="button"
          className={toolButton}
          onClick={() => {
            setError(null);
            if (!text.trim()) return setError("Nothing to parse.");
            try {
              JSON.parse(text);
              setError(null);
            } catch (err) {
              setError(describe(err));
            }
          }}
        >
          Validate
        </button>
      </div>
    </ToolShell>
  );
}
