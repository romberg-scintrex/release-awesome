import type { Metadata } from "next";
import { Timeline } from "@/components/Fragments/Timeline";
import { SectionHeading } from "@/components/Fragments/SectionHeading";
import { SITE as SITE_INFO } from "@/lib/utils";
import { getSettings, getAboutScenes } from "@/lib/queries";
import { ScrollyTelling } from "@/components/Fragments/ScrollyTelling";
import { Parallax } from "@/components/Elements/Parallax";

export const metadata: Metadata = {
  title: "About - Software Engineer",
  description: "Software Engineer specializing in scalable backend architectures and modern web applications.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Gregorius Dimas",
    description: "Software Engineer specializing in scalable backend architectures and modern web applications.",
    url: `${SITE_INFO.url}/about`,
  },
};

export const revalidate = 60;

export default async function AboutPage() {
  const settings = await getSettings();
  const scenes = await getAboutScenes();

  const avatarUrl =
    settings?.aboutImageURL && settings.aboutImageURL.trim() !== ""
      ? settings.aboutImageURL
      : "/images/avatar.png";

  return (
    <>
      {/* 1. Interactive GSAP Scrollytelling Section */}
      {scenes && scenes.length > 0 && (
        <section>
          <ScrollyTelling
            scenes={scenes}
            avatarUrl={avatarUrl}
            portraitName={settings.shortName}
            portraitRole={settings.role.split(" ")[0].toUpperCase()}
            portraitTag={`UB · '14`}
            portraitChip="Go · NextJS · Docker"
          />
        </section>
      )}

      {/* 2. Timeline Experience & Education dengan Parallax Effect */}
      <section className="container relative z-20 py-20 sm:py-28">
        <Parallax offset={20}>
          <SectionHeading
            index="02"
            eyebrow="Path so far"
            title="Education & Experience"
            description="A condensed version of my engineering journey and milestones."
          />
        </Parallax>

        <Parallax offset={36} className="mt-12">
          <Timeline />
        </Parallax>
      </section>
    </>
  );
}