import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ThemeProvider } from "@/components/Elements/Providers/ThemeProvider";
import { SettingsProvider } from "@/components/Elements/Providers/SettingsProvider";
import { SiteFrame } from "@/components/Layouts/SiteFrame";
import { getSettings } from "@/lib/queries";
import { PLATFORM, jsonLdHtml } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(PLATFORM.url),
  title: {
    default: PLATFORM.name,
    template: `%s - ${PLATFORM.name}`,
  },
  description: PLATFORM.description,
  authors: [{ name: PLATFORM.name, url: PLATFORM.url }],
  creator: PLATFORM.name,
  publisher: PLATFORM.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: PLATFORM.url,
    title: PLATFORM.name,
    description: PLATFORM.description,
    siteName: PLATFORM.name,
  },
  twitter: {
    card: "summary_large_image",
    title: PLATFORM.name,
    description: PLATFORM.description,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },
  // Optional: set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION to verify in Search Console.
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSettings();

  // JSON-LD for the platform. Person and ProfilePage describe a tenant and
  // belong on /:username pages, which build their own - the root must not
  // claim to be about any individual. See ADR-015.
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${PLATFORM.url}/#website`,
    name: PLATFORM.name,
    url: PLATFORM.url,
    description: PLATFORM.description,
    inLanguage: "en",
    potentialAction: {
      "@type": "RegisterAction",
      target: `${PLATFORM.url}/register`,
    },
  };

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} font-sans selection:bg-accent/30`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(websiteLd) }}
        />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <SettingsProvider value={settings}>
            <SiteFrame settings={settings}>{children}</SiteFrame>
          </SettingsProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
