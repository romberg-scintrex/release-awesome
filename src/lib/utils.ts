import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Serialize structured data for an inline <script type="application/ld+json">.
 * Escapes `<` to its unicode form so any content containing "</script>" (e.g.
 * an admin-authored title/description) can't break out of the script element.
 * Always use this instead of bare JSON.stringify with dangerouslySetInnerHTML.
 */
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export const TEXT_LINE1 = "GREGORIUS DIMAS A YUDHANA";
export const TEXT_LINE2 = "SOFTWARE ENGINEER  GOLANG  NEXTJS  POSTGRESQL  MICROSERVICES  DOCKER  KUBERNETES  AWS  GOOGLE CLOUD PLATFORM  AI ENTHUSIAST";
export const ROLES = ["Software Engineer", "Golang Developer", "Next JS Developer", "AI Enthusiast"];

export const SITE = {
  name: "Gregorius Dimas A Yudhana",
  shortName: "Grek",
  role: "Software Engineer",
  university: "Universitas Brawijaya",
  location: "Jakarta, Indonesia",
  email: "dimas.yudhana@gmail.com",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.grek.co.id",
  description: "Software engineer with a passion for building reliable, scalable and modern web applications.",
  social: {
    github: "https://github.com/dimasyudhana",
    linkedin: "https://www.linkedin.com/in/gregorius-dimas-a-yudhana-820008251/",
    facebook: "https://www.facebook.com/profile.php?id=100081008444052",
    instagram: "https://www.instagram.com/dimas.yudhana/",
  }
} as const;