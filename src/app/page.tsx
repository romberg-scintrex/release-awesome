import { Metadata } from "next";
import { HeroSection } from "@/components/Layouts/HeroSection";
import { MarqueeTech } from "@/components/Layouts/MarqueeTech";
import { SlideDesktop } from "@/components/Layouts/SliderDesktop";
import { Testimonials } from "@/components/Layouts/Testimonials";
import { SITE, jsonLdHtml } from "@/lib/utils";
import { getSettings, getTestimonials } from "@/lib/queries";
import { defaultSlides } from "@/lib/default";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export const revalidate = 60;

export default async function Home() {

    const [ settings, testimonials ] = await Promise.all([
    getSettings(),
    getTestimonials(),
  ]);
  
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
        fetchPriority="high"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(profilePageLd) }}
      />
      <HeroSection />
      <MarqueeTech />
      <SlideDesktop 
        slides={defaultSlides}
        heading={{
          index: "01",
          eyebrow: "Writing",
          title: "Thoughts worth shipping",
          description: "Notes from the trenches of building software — lessons learned, ideas explored, and the occasional rabbit hole. Grab a coffee and dig in.",
        }}
      />
      <Testimonials 
        testimonials={testimonials}
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
