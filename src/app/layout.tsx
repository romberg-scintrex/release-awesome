import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ThemeProvider } from "@/components/Elements/Providers/ThemeProvider";
import { SettingsProvider } from "@/components/Elements/Providers/SettingsProvider";
import { SiteFrame } from "@/components/Layouts/SiteFrame";
import { getSettings } from "@/lib/queries";
import { SITE, jsonLdHtml } from "@/lib/utils";

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
  metadataBase: new URL(SITE.url),
  title: {
    default: "Gregorius Dimas A Yudhana - Software Engineer | Indonesia",
    template: `%s - ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "Gregorius Dimas A Yudhana",
    "Dimas A Yudhana",
    "Dimas Yudhana",
    "Dimas A Yudhana portfolio",
    "Backend Golang Developer Jakarta Indonesia",
    "React developer Jakarta Indonesia",
    "NextJS developer Jakarta Indonesia",
    "Next.js developer Jakarta Indonesia",
    "full stack developer Jakarta Indonesia",
    "software engineer Jakarta Indonesia",
    "Universitas Brawijaya",
    "Brawijaya University",
    "Universitas Brawijaya software engineer",
    "Brawijaya University software engineer",
  ],
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
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
    url: SITE.url,
    title: "Gregorius Dimas A Yudhana | Software Engineer Jakarta Indonesia",
    description: SITE.description,
    siteName: SITE.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Gregorius Dimas A Yudhana | Software Engineer Jakarta Indonesia",
    description: SITE.description,
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

  // ── JSON-LD structured data — lets Google understand exactly who this site is
  //    about. Strong signal for ranking the name and a shot at a knowledge panel.
  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE.url}/#person`,
    name: settings.name,
    url: SITE.url,
    image: `${SITE.url}/opengraph-image`,
    jobTitle: "Software Engineer",
    description: SITE.description,
    email: `mailto:${settings.email}`,
    nationality: { "@type": "Country", name: "Indonesia" },
    knowsLanguage: ["en", "id"],
    worksFor: { "@type": "Organization", name: "Universitas Brawijaya" },
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: settings.university,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Jakarta",
      addressRegion: "DKI Jakarta",
      addressCountry: "ID",
    },
    knowsAbout: [
      "Golang",
      "Next.js",
      "React",
      "TypeScript",
      "PostgreSQL",
      "Microservices",
      "Docker",
      "AWS",
      "AI Enthusiast",
    ],
    sameAs: [
      settings.social.github,
      settings.social.linkedin,
      settings.social.facebook,
      settings.social.instagram,
    ].filter(Boolean),
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}/#website`,
    name: settings.name,
    url: SITE.url,
    publisher: { "@id": `${SITE.url}/#person` },
    inLanguage: "en",
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} font-sans selection:bg-accent/30`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(personLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(websiteLd) }}
        />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SettingsProvider value={settings}>
            <SiteFrame settings={settings}>{children}</SiteFrame>
          </SettingsProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
