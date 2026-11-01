import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionHeading } from "@/components/Fragments/SectionHeading";
import { GradientMesh } from "@/components/Elements/GradientMesh";
import { ToolsGrid } from "@/components/Layouts/ToolsGrid";
import { SITE } from "@/lib/utils";
import { getProfileByUsername, getToolsByUsername } from "@/lib/queries-by-user";

export const revalidate = 60;

type PageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  // Empty, so an unapproved tenant and an unknown username are
  // indistinguishable. See G12 and the layout's generateMetadata.
  if (!profile) return {};

  const title = `${profile.name} – Tools`;
  const description = `Small browser tools published by ${profile.name}.`;
  const url = `${SITE.url}/${username}/tools`;

  return {
    title,
    description,
    openGraph: { title, description, url },
    alternates: { canonical: url },
  };
}

export default async function UserToolsPage({ params }: PageProps) {
  const { username } = await params;

  const [profile, tools] = await Promise.all([
    getProfileByUsername(username),
    getToolsByUsername(username),
  ]);

  if (!profile) notFound();

  return (
    <div className="relative min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-20">
        <GradientMesh />
        <div className="container relative z-10">
          <SectionHeading
            as="h1"
            index="01"
            eyebrow={profile.name}
            title="Tools"
            description={`Small things that run entirely in your browser. Nothing you enter leaves it.`}
          />
        </div>
      </section>

      <section className="pb-24">
        <div className="container max-w-3xl">
          <ToolsGrid tools={tools} username={username} />
        </div>
      </section>
    </div>
  );
}
