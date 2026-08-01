import type { NextConfig } from "next";

// Content-Security-Policy in report-only mode.
// Switch the header key to "Content-Security-Policy" once the live site
// reports zero violations (check Vercel logs / browser console).
const csp = [
  "default-src 'self'",
  // 'unsafe-inline' covers Next.js hydration scripts and JSON-LD blocks.
  // Turnstile widget is served from challenges.cloudflare.com.
  "script-src 'self' 'unsafe-inline' challenges.cloudflare.com",
  // Tailwind and framer-motion both write inline styles.
  "style-src 'self' 'unsafe-inline'",
  // Supabase media, placeholder images used in dev/demo, data/blob for WebGL.
  "img-src 'self' data: blob: *.supabase.co picsum.photos images.unsplash.com",
  // Supabase REST + realtime (wss), own API routes.
  "connect-src 'self' *.supabase.co wss://*.supabase.co",
  // Turnstile renders in an iframe.
  "frame-src challenges.cloudflare.com",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          // Report-only: violations are logged but never blocked.
          // Flip to "Content-Security-Policy" once the live site is clean.
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
