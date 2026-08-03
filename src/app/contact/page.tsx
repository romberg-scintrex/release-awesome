import type { Metadata } from "next";
import ContactLayout from "@/components/Layouts/Contact";
import { SITE } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact - Hire a Software Engineer",
  description: "I'm always open to discussing software engineering projects collaborations or any other opportunities. Drop me a message and I'll get back to you as soon as I can.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Gregorius Dimas A Yudhana",
    description: "I'm always open to discussing software engineering projects collaborations or any other opportunities. Drop me a message and I'll get back to you as soon as I can.",
    url: `${SITE.url}/contact`,
  },
};

export const revalidate = 60;

export default function ContactPage() {
  return <ContactLayout />;
}
