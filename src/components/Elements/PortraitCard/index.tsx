import Image from "next/image";
import { SpotlightCard } from "@/components/Elements/SpotlightCard";

interface PortraitCardProps {
  src: string;
  name?: string;
  role?: string;
  tag?: string;
  chip?: string;
}

export function PortraitCard({ src, name, role, tag, chip }: PortraitCardProps) {
  return (
    <div className="relative w-full h-auto">
      <SpotlightCard className="w-full rounded-[2rem] bg-transparent" color="rgba(16, 185, 129, 0.08)">
        <div className="relative w-full overflow-hidden rounded-[2rem] bg-transparent shadow-2xl transform-gpu">
          {/* Gambar Full Size tanpa cropping dan tanpa background warna */}
          <Image
            src={src}
            alt={name ?? "Profile portrait"}
            width={600}
            height={800}
            priority
            className="w-full h-auto object-contain filter drop-shadow-[0_0_30px_rgba(16,185,129,0.4)]"
          />
          
          {/* Gradient Overlay bawah (tipis agar teks tetap terbaca) */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
          
          {tag && (
            <span className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
              {tag}
            </span>
          )}
          {name && (
            <span className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
              {name}
            </span>
          )}
          {role && (
            <span className="absolute bottom-4 right-4 flex items-end gap-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
              {role}
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="mb-px shrink-0" aria-hidden>
                <path d="M1 1h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
        </div>
      </SpotlightCard>

      {chip && (
        <div className="pointer-events-none absolute -bottom-4 -right-4 z-10 flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 shadow-xl backdrop-blur-md ring-1 ring-white/10">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.5)]" />
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-white">{chip}</span>
        </div>
      )}
    </div>
  );
}