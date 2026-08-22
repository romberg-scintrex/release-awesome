import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Timeline } from "@/components/Fragments/Timeline";
import { SectionHeading } from "@/components/Fragments/SectionHeading";
import { ScrollyTelling } from "@/components/Fragments/ScrollyTelling";
import { Parallax } from "@/components/Elements/Parallax";
import { SITE } from "@/lib/utils";
import { getProfileByUsername, getAboutScenesByUsername } from "@/lib/queries-by-user";

export const revalidate = 60;

type PageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return {};

  const url = `${SITE.url}/${username}/about`;
  const title = `${profile.name} – About`;

  return {
    title,
    openGraph: {
      title,
      description: profile.description,
      url,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function UserAboutPage({ params }: PageProps) {
  const { username } = await params;

  const [profile, scenes] = await Promise.all([
    getProfileByUsername(username),
    getAboutScenesByUsername(username),
  ]);

  if (!profile) notFound();

  const avatarUrl =
    profile.aboutImageURL && profile.aboutImageURL.trim() !== ""
      ? profile.aboutImageURL
      : "/images/avatar.png";

  return (
    <>
      {scenes && scenes.length > 0 && (
        <ScrollyTelling
          scenes={scenes}
          avatarUrl={avatarUrl}
          portraitName={profile.shortName}
          portraitRole={profile.role.split(" ")[0].toUpperCase()}
          portraitTag={profile.university}
          portraitChip="Go · NextJS · Docker"
        />
      )}

      <div id="timeline" className="container relative z-20 py-20 sm:py-28 scroll-mt-20">
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
      </div>
    </>
  );
}
