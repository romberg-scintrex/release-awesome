// Built-in tools that an "embedded" Tool row can render via its
// `component_key`. Plain metadata - no React, no next/dynamic - so it is safe
// to import from both server pages and the admin form.
//
// **This list contains exactly the tools that exist.** The admin dropdown is
// built from it, so an entry without an implementation is a choice that renders
// nothing. src/components/tools/ToolEmbed.test.tsx asserts the correspondence
// in both directions, which means adding an entry is part of building its
// component - the same discipline AdminNavbar's test enforces for links.
//
// To add a tool:
//   1. Build its client component under src/components/tools/.
//   2. Add it to TOOL_MAP in src/components/tools/ToolEmbed.tsx.
//   3. Add an entry below.
//
// Removed 2026-11-01, deferred on CSP grounds rather than effort - see
// .claude/specs/embedded-tools-platform/design.md D1:
//   ocr                 tesseract.js needs a CDN fetch and a blob worker
//   background-remover  @imgly/background-removal needs the same
// Both are blocked by the enforcing policy in next.config.ts: `connect-src`
// excludes those CDNs and there is no `worker-src`, so `default-src 'self'`
// refuses a blob worker.

export interface ToolComponentMeta {
  key: string;
  label: string;
  description: string;
}

export const TOOL_COMPONENTS: ToolComponentMeta[] = [
  {
    key: "json-formatter",
    label: "JSON Formatter",
    description: "Pretty-print, validate, and minify JSON.",
  },
  {
    key: "jwt-decoder",
    label: "JWT Decoder",
    description: "Decode a JWT's header and payload (no verification).",
  },
  {
    key: "base64",
    label: "Base64 Encoder / Decoder",
    description: "Encode text to Base64 or decode it back (UTF-8 safe).",
  },
  {
    key: "hash-generator",
    label: "Hash Generator",
    description: "Compute SHA-1/256/384/512 hashes via the Web Crypto API.",
  },
  {
    key: "url-encoder",
    label: "URL Encoder / Decoder",
    description: "Percent-encode or decode text for URLs.",
  },
  {
    key: "qr-code-generator",
    label: "QR Code Generator",
    description: "Generate a QR code and download it as PNG or SVG.",
  },
  {
    key: "image-compressor",
    label: "Image Compressor",
    description: "Shrink JPG/PNG/WebP file size with an adjustable quality slider.",
  },
  {
    key: "image-converter",
    label: "Image Converter",
    description: "Convert images between PNG, JPEG, and WebP.",
  },
  {
    key: "image-resizer",
    label: "Image Resizer",
    description: "Resize images to exact dimensions with an optional aspect lock.",
  },
];

export function isToolComponentKey(key: string | null | undefined): boolean {
  return !!key && TOOL_COMPONENTS.some((c) => c.key === key);
}
