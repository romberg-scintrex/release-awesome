import MaskRevealHero from "@/components/Fragments/MaskReveal";
import { NoiseTexture } from "@/components/Elements/NoiseTexture";
import { HeroOverlay } from "@/components/Fragments/HeroOverlay";
import { MobileHero } from "@/components/Fragments/HeroMobile";

export function HeroSection() {
  return (
    <section className="relative isolate">
      {/* Mobile — bespoke editorial hero (no WebGL, touch-first) */}
      <MobileHero className="md:hidden" />

      {/* Tablet / desktop — WebGL fluid mask-reveal hero */}
      <div className="relative hidden h-[100svh] min-h-[640px] w-full overflow-hidden md:block">
        <MaskRevealHero />
        <HeroOverlay />
        <NoiseTexture className="z-30" opacity={0.04} />
        {/* Bottom fade into next section — sits BEHIND the overlay rail (z-15 < overlay z-20) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-40 bg-gradient-to-b from-transparent via-[rgb(var(--bg)/0.5)] to-[rgb(var(--bg))]" />
      </div>
    </section>
  );
}
