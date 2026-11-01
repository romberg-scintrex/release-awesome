"use client";

import dynamic from "next/dynamic";
import { AlertCircle } from "lucide-react";
import { ToolErrorBoundary } from "./ToolErrorBoundary";

const Loading = () => (
  <div className="h-64 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
);

/**
 * Component_Key → lazily loaded tool.
 *
 * A **static object literal**, deliberately. `import(\`./${key}\`)` would make
 * the bundler include every possible match in one chunk, which defeats the
 * point of splitting them. The literal also gives `ToolComponentKey` as a real
 * union, so the correspondence with TOOL_COMPONENTS is a compile-time fact as
 * well as a tested one.
 *
 * `ssr: false` is why this file is a Client Component: in a Server Component it
 * is a hard error in Next.js 16.
 */
const TOOL_MAP = {
  "json-formatter": dynamic(() => import("./JsonFormatter"), { ssr: false, loading: Loading }),
  "jwt-decoder": dynamic(() => import("./JwtDecoder"), { ssr: false, loading: Loading }),
  "base64": dynamic(() => import("./Base64Tool"), { ssr: false, loading: Loading }),
  "hash-generator": dynamic(() => import("./HashGenerator"), { ssr: false, loading: Loading }),
  "url-encoder": dynamic(() => import("./UrlEncoder"), { ssr: false, loading: Loading }),
  "qr-code-generator": dynamic(() => import("./QrCodeGenerator"), { ssr: false, loading: Loading }),
  "image-compressor": dynamic(() => import("./ImageCompressor"), { ssr: false, loading: Loading }),
  "image-converter": dynamic(() => import("./ImageConverter"), { ssr: false, loading: Loading }),
  "image-resizer": dynamic(() => import("./ImageResizer"), { ssr: false, loading: Loading }),
} as const;

export type ToolComponentKey = keyof typeof TOOL_MAP;

/** Exported for the correspondence test; not meant for rendering decisions. */
export const TOOL_MAP_KEYS = Object.keys(TOOL_MAP) as ToolComponentKey[];

export interface ToolEmbedProps {
  /** Validated with isToolComponentKey() before being passed in. */
  componentKey: string | null;
  /** Shown in the unavailable and error states. */
  toolName: string;
}

export function ToolEmbed({ componentKey, toolName }: Readonly<ToolEmbedProps>) {
  const Tool = componentKey
    ? (TOOL_MAP as Record<string, React.ComponentType | undefined>)[componentKey]
    : undefined;

  if (!Tool) {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl border border-black/10 p-5 dark:border-white/10"
      >
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-ink-400" />
        <div>
          <p className="text-sm font-medium">{toolName} isn&apos;t available</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-500 dark:text-ink-300">
            This tool is configured but its component is missing. Nothing is
            broken — there is just nothing to show.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ToolErrorBoundary toolName={toolName}>
      <Tool />
    </ToolErrorBoundary>
  );
}
