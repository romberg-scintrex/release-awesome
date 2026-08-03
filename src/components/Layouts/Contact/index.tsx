import { Reveal } from "@/components/Elements/Reveal";
import { GradientMesh } from "@/components/Elements/GradientMesh";
import { ContactForm } from "@/components/Fragments/ContactForm";
import ContactInfo from "@/components/Fragments/ContactInfo";
import { SectionHeading } from "@/components/Fragments/SectionHeading";

export default async function ContactLayout() {

  return (
    <>
      <section className="relative isolate overflow-hidden pt-36 pb-12 sm:pt-44 sm:pb-16">
        <GradientMesh className="opacity-40" />
        <div className="container relative">
          <SectionHeading
            as="h1"
            index="01"
            eyebrow="Contact"
            title="Let's make something good together."
            description="I'm always open to discussing software engineering projects collaborations or any other opportunities. Drop me a message and I'll get back to you as soon as I can."
          />
        </div>
      </section>

      <section className="container pb-32">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] items-stretch">
          <Reveal>
            <ContactInfo />
          </Reveal>
          <Reveal delay={0.05}>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
