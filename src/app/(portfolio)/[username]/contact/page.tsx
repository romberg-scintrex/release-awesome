import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GradientMesh } from "@/components/Elements/GradientMesh";
import { Reveal } from "@/components/Elements/Reveal";
import {
  GithubIcon,
  LinkedinIcon,
  FacebookIcon,
  InstagramIcon,
} from "@/components/Elements/Icons";
import { SectionHeading } from "@/components/Fragments/SectionHeading";
import { ContactForm } from "@/components/Fragments/ContactForm";
import { ContactInfoView } from "@/components/Fragments/ContactInfo/ContactInfoView";
import { getProfileByUsername } from "@/lib/queries-by-user";
import { SITE } from "@/lib/utils";

export const revalidate = 60;

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) return {};

  const url = `${SITE.url}/${username}/contact`;
  const title = `Contact – ${profile.name}`;
  const description = `Contact ${profile.name} – ${profile.role}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `Contact ${profile.name}`,
      description,
      url,
    },
  };
}

export default async function TenantContactPage({ params }: Props) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) notFound();

  const socials = [
    ...(profile.social.github
      ? [
          {
            Icon: GithubIcon,
            label: "GitHub",
            value: profile.social.github,
            href: `https://github.com/${profile.social.github}`,
          },
        ]
      : []),
    ...(profile.social.linkedin
      ? [
          {
            Icon: LinkedinIcon,
            label: "LinkedIn",
            value: profile.social.linkedin,
            href: `https://linkedin.com/in/${profile.social.linkedin}`,
          },
        ]
      : []),
    ...(profile.social.facebook
      ? [
          {
            Icon: FacebookIcon,
            label: "Facebook",
            value: profile.social.facebook,
            href: `https://facebook.com/${profile.social.facebook}`,
          },
        ]
      : []),
    ...(profile.social.instagram
      ? [
          {
            Icon: InstagramIcon,
            label: "Instagram",
            value: profile.social.instagram,
            href: `https://instagram.com/${profile.social.instagram}`,
          },
        ]
      : []),
  ];

  const mapEmbedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(
    profile.location || "Jakarta, Indonesia"
  )}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

  return (
    <>
      <section className="relative isolate overflow-hidden pt-36 pb-12 sm:pt-44 sm:pb-16">
        <GradientMesh className="opacity-40" />
        <div className="container relative">
          <SectionHeading
            as="h1"
            index="01"
            eyebrow="Contact"
            title={`Let's work together.`}
            description={`Reach out to ${profile.name} — always open to discussing opportunities.`}
          />
        </div>
      </section>

      <section className="container pb-32">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] items-stretch">
          <Reveal>
            <ContactInfoView
              email={profile.email}
              location={profile.location}
              locationFlag=""
              timezone="UTC+7"
              mapEmbedSrc={mapEmbedSrc}
              mapTitle={profile.location || "Location"}
              socials={socials}
            />
          </Reveal>
          <Reveal delay={0.05}>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
