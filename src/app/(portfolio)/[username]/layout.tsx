import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { ProfileProvider } from "@/components/Elements/Providers/ProfileProvider";
import { getProfileByUsername } from "@/lib/queries-by-user";
import { SITE, jsonLdHtml } from "@/lib/utils";

interface ProfileLayoutProps {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}

// ── Dynamic Metadata Per Profil ──────────────────────────────────────────────
export async function generateMetadata({ params }: ProfileLayoutProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) {
    return {
      title: "Profile Not Found",
    };
  }

  const title = `${profile.name} - ${profile.role ?? "Software Engineer"}`;
  const description = profile.description || SITE.description;
  const profileUrl = `${SITE.url}/${username}`;
  const ogImage = profile.heroFrontURL ?? profile.aboutImageURL ?? `${SITE.url}/opengraph-image`;

  return {
    title: {
      default: title,
      template: `%s - ${profile.name}`,
    },
    description,
    keywords: [
      profile.name,
      profile.shortName,
      username,
      `${profile.name} portfolio`,
      profile.role ?? "Software Engineer",
      profile.university ?? "",
      profile.location ?? "",
    ].filter(Boolean),
    authors: [{ name: profile.name, url: profileUrl }],
    creator: profile.name,
    openGraph: {
      type: "profile",
      locale: "en_US",
      url: profileUrl,
      title,
      description,
      siteName: SITE.name,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
  ],
};

// ── Profile Layout Component ─────────────────────────────────────────────────
export default async function ProfileLayout({
  children,
  params,
}: ProfileLayoutProps) {
  const { username } = await params;

  const profile = await getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  const profileUrl = `${SITE.url}/${username}`;

  // ── JSON-LD Structured Data khusus untuk Profil ────────────────────────────
  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${profileUrl}/#person`,
    name: profile.name,
    alternateName: profile.shortName,
    url: profileUrl,
    image: profile.heroFrontURL ?? profile.aboutImageURL ?? `${SITE.url}/opengraph-image`,
    jobTitle: profile.role ?? "Software Engineer",
    description: profile.description || SITE.description,
    email: profile.email ? `mailto:${profile.email}` : undefined,
    address: profile.location
      ? {
          "@type": "PostalAddress",
          addressLocality: profile.location,
        }
      : undefined,
    alumniOf: profile.university
      ? {
          "@type": "CollegeOrUniversity",
          name: profile.university,
        }
      : undefined,
    sameAs: [
      profile.social?.github,
      profile.social?.linkedin,
      profile.social?.facebook,
      profile.social?.instagram,
    ].filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(personLd) }}
      />
      <ProfileProvider value={profile}>
        {children}
      </ProfileProvider>
    </>
  );
}