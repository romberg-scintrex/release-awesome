import type { NextConfig } from "next";

// Content-Security-Policy — enforcing mode.
const csp = [
  "default-src 'self'",
  // Turnstile widget & Google Maps JS
  "script-src 'self' 'unsafe-inline' challenges.cloudflare.com",
  // Tailwind & Framer Motion inline styles
  "style-src 'self' 'unsafe-inline'",
  // Supabase media, tech logos, serta ubin gambar Google Maps (*.google.com & *.gstatic.com)
  "img-src 'self' data: blob: *.supabase.co picsum.photos images.unsplash.com cdn.simpleicons.org upload.wikimedia.org *.google.com *.gstatic.com *.googleapis.com",
  // Supabase, Vercel Insights, Cloudflare Turnstile POST, dan fetch data Google Maps
  "connect-src 'self' *.supabase.co wss://*.supabase.co vitals.vercel-insights.com challenges.cloudflare.com *.google.com *.gstatic.com *.googleapis.com",
  // Turnstile iframe & Google Maps embed iframe
  "frame-src 'self' challenges.cloudflare.com *.google.com www.google.com",
  // Font internal & font dari Google Maps/Static
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