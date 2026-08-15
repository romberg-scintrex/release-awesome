import type { NextConfig } from "next";

// Content-Security-Policy — enforcing mode.
const csp = [
  "default-src 'self'",
  // Tambahkan 'unsafe-eval' agar React dev-mode & Turnstile script bisa berjalan
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: *.supabase.co picsum.photos images.unsplash.com cdn.simpleicons.org upload.wikimedia.org *.google.com *.gstatic.com *.googleapis.com",
  "connect-src 'self' challenges.cloudflare.com *.supabase.co wss://*.supabase.co vitals.vercel-insights.com *.google.com *.gstatic.com *.googleapis.com",
  "frame-src 'self' challenges.cloudflare.com *.google.com www.google.com",
  "font-src 'self' data: *.gstatic.com",
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
      { protocol: "https", hostname: "cdn.simpleicons.org" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
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
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;