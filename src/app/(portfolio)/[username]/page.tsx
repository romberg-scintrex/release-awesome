import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HeroSection } from "@/components/Layouts/HeroSection";
import { MarqueeTech } from "@/components/Layouts/MarqueeTech";
import { WritingSliderSection } from "@/components/Layouts/WritingSliderSection";
import { Testimonials } from "@/components/Layouts/Testimonials";
import { SITE, jsonLdHtml } from "@/lib/utils";
import { defaultSlides } from "@/lib/default";
import { 
  getProfileByUsername, 
  getToolsByUsername, 
  getTestimonialsByUsername 
} from "@/lib/queries-by-user";

export const revalidate = 60;
export const dynamic = "force-static";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) return {};

  const canonicalUrl = `${SITE.url}/${username}`;

  return {
    title: `${profile.name} – ${profile.role}`,
    description: profile.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${profile.name} – ${profile.role}`,
      description: profile.description,
      url: canonicalUrl,
    },
  };
}

export default async function TenantHomePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  // Fetch data spesifik tenant secara paralel
  const [profile, tools, testimonials] = await Promise.all([
    getProfileByUsername(username),
    getToolsByUsername(username),
    getTestimonialsByUsername(username),
  ]);

  if (!profile) notFound();

  const profilePageLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${SITE.url}/${username}/#profilepage`,
    url: `${SITE.url}/${username}`,
    mainEntity: { "@id": `${SITE.url}/${username}/#person` },
  };

  return (
    <>
      {/* Preload dynamic hero assets milik tenant */}
      <link
        rel="preload"
        as="image"
        href={profile.heroBackURL ?? "/images/p3.webp"}
        media="(min-width: 768px)"
        crossOrigin="anonymous"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href={profile.heroFrontURL ?? "/images/p2.avif"}
        media="(min-width: 768px)"
        crossOrigin="anonymous"
        fetchPriority="high"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(profilePageLd) }}
      />

      {/* Komponen Utama dengan data tenant */}
      <HeroSection profile={profile} />
      
      <MarqueeTech tools={tools ?? []} />

      <WritingSliderSection 
        slides={defaultSlides}
        heading={{
          index: "01",
          eyebrow: "Writing",
          title: "Thoughts worth shipping",
          description: "Notes from the trenches of building software — lessons learned, ideas explored, and the occasional rabbit hole.",
        }}
      />

      <Testimonials 
        testimonials={testimonials ?? []}
        heading={{
          index: "02",
          eyebrow: "Kind words",
          title: "What people I've worked with say",
          description: "Notes from collaborators, mentors, and clients.",
        }}
      />
    </>
  );
}