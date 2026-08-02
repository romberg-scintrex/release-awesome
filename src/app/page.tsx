import { Metadata } from "next";
import { HeroSection } from "@/components/Layouts/HeroSection";
import { SITE, jsonLdHtml } from "@/lib/utils";
import { getSettings } from "@/lib/queries";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export const revalidate = 60;

export default async function Home() {

  const settings = await getSettings();
  
  const profilePageLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${SITE.url}/#profilepage`,
    url: SITE.url,
    mainEntity: { "@id": `${SITE.url}/#person` },
  };

  return (
    <>
      {/* Preload the desktop hero textures so the browser fetches them during the
          initial HTML parse - in parallel with the JS bundle - instead of only
          after three.js dynamically loads inside <MaskRevealHero/>. crossOrigin
          matches three's TextureLoader (anonymous) so the preload is reused rather
          than re-fetched; media-gated to >=md so phones (which render <MobileHero/>)
          skip these and rely on its own <Image priority>. */}
      <link
        rel="preload"
        as="image"
        href={settings.heroBackURL ?? "/images/p3.webp"}
        media="(min-width: 768px)"
        crossOrigin="anonymous"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href={settings.heroFrontURL ?? "/images/p2.avif"}
        media="(min-width: 768px)"
        crossOrigin="anonymous"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(profilePageLd) }}
      />
      <HeroSection />
    </>
  );
}
