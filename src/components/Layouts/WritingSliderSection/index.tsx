"use client";

import { SlideDesktop } from "@/components/Fragments/SliderDesktop";
import { SlideMobile } from "@/components/Fragments/SliderMobile";
import type { SlideItem } from "@/lib/types";

interface HeadingProps {
  index?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  headingAs?: "h2" | "h3";
}

interface WritingSliderSectionProps {
  slides: SlideItem[];
  heading?: HeadingProps;
  autoPlayMs?: number;
}

export function WritingSliderSection({
  slides,
  heading,
  autoPlayMs = 60000,
}: WritingSliderSectionProps) {
  return (
    <>
      {/* Tampilan Mobile (< md) */}
      <SlideMobile slides={slides} heading={heading} />

      {/* Tampilan Desktop (>= md) - Memakai versi asli SlideDesktop tanpa terpotong */}
      <div className="hidden md:block">
        <SlideDesktop
          slides={slides}
          heading={heading}
          autoPlayMs={autoPlayMs}
        />
      </div>
    </>
  );
}