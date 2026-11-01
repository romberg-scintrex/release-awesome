"use client";

import { useMemo, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { ToolShell, toolInput, toolLabel } from "./ToolShell";
import { decodeBase64 } from "./Base64Tool";

/** base64url → base64, then the UTF-8 safe decode. */
function decodeSegment(segment: string): unknown {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeBase64(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return JSON.parse(json);
}

type Decoded = { header: unknown; payload: unknown } | { error: string };

function decodeJwt(token: string): Decoded {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    return { error: "A JWT has three dot-separated parts." };
  }
  try {
    return { header: decodeSegment(parts[0]), payload: decodeSegment(parts[1]) };
  } catch {
    return { error: "The header or payload is not valid base64url JSON." };
  }
}

/** Seconds-since-epoch claims, rendered as dates because that is the point of them. */
function annotate(payload: unknown): Array<[string, string]> {
  if (!payload || typeof payload !== "object") return [];
  const out: Array<[string, string]> = [];
  for (const claim of ["iat", "nbf", "exp"]) {
    const v = (payload as Record<string, unknown>)[claim];
    if (typeof v === "number") {
      out.push([claim, new Date(v * 1000).toISOString()]);
    }
  }
  return out;
}

export default function JwtDecoder() {
  const [token, setToken] = useState("");
  const decoded = useMemo(() => (token.trim() ? decodeJwt(token) : null), [token]);
  const error = decoded && "error" in decoded ? decoded.error : null;
  const dates = decoded && !("error" in decoded) ? annotate(decoded.payload) : [];

  return (
    <ToolShell error={error}>
      <p className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
        <ShieldAlert size={15} className="mt-0.5 shrink-0" />
        <span>
          <strong>The signature is not verified.</strong> This decodes what the
          token claims; it proves nothing about who issued it.
        </span>
      </p>

      <div>
        <label className={toolLabel} htmlFor="jwt">Token</label>
        <textarea
          id="jwt"
          rows={5}
          className={toolInput}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="eyJhbGciOi…"
          spellCheck={false}
        />
      </div>

      {decoded && !("error" in decoded) && (
        <>
          <div>
            <label className={toolLabel}>Header</label>
            <pre className={`${toolInput} overflow-auto`}>
              {JSON.stringify(decoded.header, null, 2)}
            </pre>
          </div>
          <div>
            <label className={toolLabel}>Payload</label>
            <pre className={`${toolInput} overflow-auto`}>
              {JSON.stringify(decoded.payload, null, 2)}
            </pre>
          </div>
          {dates.length > 0 && (
            <dl className="rounded-xl border border-black/10 p-3 text-sm dark:border-white/10">
              {dates.map(([claim, iso]) => (
                <div key={claim} className="flex gap-2">
                  <dt className="font-mono text-ink-400">{claim}</dt>
                  <dd className="font-mono">{iso}</dd>
                </div>
              ))}
            </dl>
          )}
        </>
      )}
    </ToolShell>
  );
}
