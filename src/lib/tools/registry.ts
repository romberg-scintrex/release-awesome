// Built-in functional tools that an "embedded" Tool row can render via its
// `component_key`. This file is plain metadata (no React / no next-dynamic) so
// it's safe to import from both server pages and the admin form.
//
// To add a new tool:
//   1. Build its client component under src/components/tools/.
//   2. Register the component in src/components/tools/ToolEmbed.tsx.
//   3. Add an entry below so it appears in the admin "component" dropdown.

export interface ToolComponentMeta {
  key: string;
  label: string;
  description: string;
}

export const TOOL_COMPONENTS: ToolComponentMeta[] = [
  {
    key: "background-remover",
    label: "Background Remover",
    description: "In-browser AI background removal that outputs a transparent PNG.",
  },
  {
    key: "image-compressor",
    label: "Image Compressor",
    description: "Shrink JPG/PNG/WebP file size with an adjustable quality slider.",
  },
  {
    key: "image-converter",
    label: "Image Converter",
    description: "Convert images between PNG, JPG, and WebP.",
  },
  {
    key: "image-resizer",
    label: "Image Resizer",
    description: "Resize images to exact dimensions with optional aspect lock.",
  },
  {
    key: "qr-code-generator",
    label: "QR Code Generator",
    description: "Generate a customizable QR code and download it as PNG or SVG.",
  },
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
    key: "ocr",
    label: "Image to Text (OCR)",
    description: "Extract text from an image in the browser with Tesseract.js.",
  },
];

export function isToolComponentKey(key: string | null | undefined): boolean {
  return !!key && TOOL_COMPONENTS.some((c) => c.key === key);
}
