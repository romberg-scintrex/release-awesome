import {
  GithubIcon,
  LinkedinIcon,
  FacebookIcon,
  InstagramIcon,
} from "@/components/Elements/Icons";
import { getSettings } from "@/lib/queries";
import { ContactInfoView } from "./ContactInfoView";
import type { SocialLink } from "./types";

/**
 * Server Component — fetches settings and maps them into typed props
 * for the presentational `ContactInfoView`.
 */
export default async function ContactInfo() {
  const settings = await getSettings();

  const socials: SocialLink[] = [
    { Icon: GithubIcon, label: "GitHub", value: "dimasyudhana", href: settings.social.github },
    { Icon: LinkedinIcon, label: "LinkedIn", value: "Gregorius Dimas A Yudhana", href: settings.social.linkedin },
    { Icon: FacebookIcon, label: "Facebook", value: "Gregorius Dimas A Yudhana", href: settings.social.facebook },
    { Icon: InstagramIcon, label: "Instagram", value: "@dimas.yudhana", href: settings.social.instagram },
  ];

  return (
    <ContactInfoView
      email={settings.email}
      location={settings.location}
      locationFlag=""
      timezone="UTC+7"
      mapEmbedSrc="https://maps.google.com/maps?q=Jakarta,+Indonesia&t=&z=13&ie=UTF8&iwloc=&output=embed"
      mapTitle="Jakarta, Indonesia"
      socials={socials}
    />
  );
}
