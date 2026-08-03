import type { ComponentType, SVGProps } from "react";

export interface SocialLink {
  Icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  label: string;
  value: string;
  href: string;
}

export interface ContactInfoProps {
  email: string;
  location: string;
  /** Flag emoji for the location, e.g. "🇮🇩" */
  locationFlag?: string;
  /** Timezone badge label, e.g. "UTC+7" */
  timezone: string;
  /** Google Maps embed src for the location card */
  mapEmbedSrc: string;
  /** Map iframe title for accessibility */
  mapTitle: string;
  socials: SocialLink[];
}
