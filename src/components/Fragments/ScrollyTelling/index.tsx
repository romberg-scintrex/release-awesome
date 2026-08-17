"use client";

import React, { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PortraitCard } from "@/components/Elements/PortraitCard";
import { AboutScene } from "@/lib/types";

gsap.registerPlugin(ScrollTrigger);

interface ScrollyTellingProps {
  scenes: AboutScene[];
  avatarUrl?: string;
  portraitName: string;
  portraitRole: string;
  portraitTag: string;
  portraitChip: string;
}

export function ScrollyTelling({
  scenes,
  avatarUrl,
  portraitName,
  portraitRole,
  portraitTag,
  portraitChip,
}: ScrollyTellingProps) {
  // Container utama 100vh yang menangani event scroll lokal
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const bgTextRef = useRef<HTMLDivElement>(null);
  const charRef = useRef<HTMLDivElement>(null);
  const auraRef = useRef<HTMLDivElement>(null);

  const text1Ref = useRef<HTMLDivElement>(null);
  const text2Ref = useRef<HTMLDivElement>(null);
  const text3Ref = useRef<HTMLDivElement>(null);

  const validAvatarUrl = avatarUrl && avatarUrl.trim() !== "" ? avatarUrl : null;

  useLayoutEffect(() => {
    if (!scenes.length || !scrollerRef.current || !trackRef.current) return;

    const scroller = scrollerRef.current;

    const ctx = gsap.context(() => {
      const text1 = text1Ref.current;
      const text2 = text2Ref.current;
      const text3 = text3Ref.current;

      // 1. Initial Position Setup
      gsap.set(charRef.current, { x: "25vw", scale: 1 });
      gsap.set(auraRef.current, { x: "25vw", scale: 1, opacity: 0.8 });
      gsap.set(bgTextRef.current, { x: "15vw" });

      if (text1) gsap.set(text1, { opacity: 1, x: 0 });
      if (text2) gsap.set(text2, { opacity: 0, x: 60 });
      if (text3) gsap.set(text3, { opacity: 0, x: 60 });

      // 2. Timeline GSAP berbasis Native Scroll progress dari Scroller Lokal
      const tl = gsap.timeline({
        scrollTrigger: {
          scroller: scroller, // Menjadikan div 100vh sebagai konteks scroll murni
          trigger: trackRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      // --- SCENE 1 KE 2 ---
      if (text1) tl.to(text1, { opacity: 0, x: -60, duration: 1 });

      tl.to(
        charRef.current,
        { x: "0vw", scale: 1.15, duration: 2, ease: "power1.inOut" },
        "<"
      )
        .to(auraRef.current, { x: "0vw", scale: 1.4, opacity: 1, duration: 2 }, "<")
        .to(bgTextRef.current, { x: "-5vw", duration: 2 }, "<");

      if (text2) tl.to(text2, { opacity: 1, x: 0, duration: 1 }, "-=1");

      // --- SCENE 2 KE 3 ---
      if (text2) tl.to(text2, { opacity: 0, x: -60, duration: 1 }, "+=0.5");

      tl.to(
        charRef.current,
        { x: "-25vw", scale: 1, duration: 2, ease: "power1.inOut" },
        "<"
      )
        .to(auraRef.current, { x: "-25vw", scale: 1, opacity: 0.7, duration: 2 }, "<")
        .to(bgTextRef.current, { x: "-35vw", duration: 2 }, "<");

      if (text3) tl.to(text3, { opacity: 1, x: 0, duration: 1 }, "-=1");
    }, scrollerRef);

    return () => ctx.revert();
  }, [scenes]);

  if (!scenes || scenes.length === 0) return null;

  return (
    /* 1. Main Scroller: Membatasi layar persis h-screen (100vh) dengan scrollbar internal tersembunyi */
    <section className="relative w-full border-y border-black/10 dark:border-white/10">
      <div
        ref={scrollerRef}
        className="relative w-full h-screen overflow-y-auto scrollbar-none text-[rgb(var(--fg))] transition-colors duration-300"
      >
        {/* 2. Track Container: Digunakan ScrollTrigger lokal untuk menghitung progress scroll */}
        <div ref={trackRef} className="relative w-full h-[300vh]">
          {/* 3. Fixed Viewport Container: Mengunci tampilan visual tetap di viewport 100vh saat di-scroll */}
          <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center select-none">
            {/* Kinetic Background Typography */}
            <div
              ref={bgTextRef}
              className="absolute font-black uppercase text-[24vw] leading-none text-[rgb(var(--fg)/0.04)] dark:text-[rgb(var(--fg)/0.025)] tracking-tighter whitespace-nowrap select-none will-change-transform z-0 pointer-events-none"
              aria-hidden
            >
              {scenes.map((s) => s.bg_kinetic_text ?? "ENGINEER").join(" · ")}
            </div>

            {/* Container Karakter & Aura */}
            <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
              <div
                ref={charRef}
                className="absolute z-10 flex h-[75vh] w-[340px] max-w-[85vw] items-center justify-center will-change-transform pointer-events-auto"
              >
                {validAvatarUrl && (
                  <PortraitCard
                    src={validAvatarUrl}
                    name={portraitName}
                    role={portraitRole}
                    tag={portraitTag}
                    chip={portraitChip}
                  />
                )}
              </div>

              <div
                ref={auraRef}
                className="absolute z-0 h-[450px] w-[450px] rounded-full bg-[radial-gradient(circle,_rgba(var(--accent),0.25)_0%,_rgba(var(--bg),0)_70%)] pointer-events-none will-change-transform"
              />
            </div>

            {/* Scene 1: Teks Kiri */}
            {scenes[0] && (
              <div
                ref={text1Ref}
                className="absolute left-[8%] text-left max-w-[500px] z-20 will-change-transform pointer-events-auto"
              >
                <div>
                  {(scenes[0].badge_text || scenes[0].subtitle_code) && (
                    <span className="text-[rgb(var(--accent))] font-mono text-xs tracking-wider uppercase block mb-1">
                      {scenes[0].badge_text ?? scenes[0].subtitle_code}
                    </span>
                  )}
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[rgb(var(--fg))] mb-4 leading-tight">
                    {scenes[0].title_primary}{" "}
                    {scenes[0].title_highlight && (
                      <span className="text-[rgb(var(--accent))]">{scenes[0].title_highlight}</span>
                    )}
                  </h1>
                  <p className="text-[rgb(var(--muted))] text-sm sm:text-base leading-relaxed mb-4">
                    {scenes[0].description}
                  </p>
                  {scenes[0].button_label && scenes[0].button_url && (
                    <a
                      href={scenes[0].button_url}
                      className="inline-block bg-[rgb(var(--accent))] hover:opacity-90 text-[rgb(var(--bg))] font-bold px-6 py-2.5 rounded-xl transition duration-300 shadow-lg shadow-[rgb(var(--accent)/0.25)] text-xs sm:text-sm btn-sheen"
                    >
                      {scenes[0].button_label}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Scene 2: Teks Kanan */}
            {scenes[1] && (
              <div
                ref={text2Ref}
                className="absolute right-[8%] text-right max-w-[500px] z-20 will-change-transform pointer-events-auto"
              >
                <div>
                  {(scenes[1].badge_text || scenes[1].subtitle_code) && (
                    <span className="text-[rgb(var(--accent))] font-mono text-xs tracking-wider uppercase block mb-1">
                      {scenes[1].badge_text ?? scenes[1].subtitle_code}
                    </span>
                  )}
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[rgb(var(--fg))] mb-4 leading-tight">
                    {scenes[1].title_primary}{" "}
                    {scenes[1].title_highlight && (
                      <span className="text-[rgb(var(--accent))]">{scenes[1].title_highlight}</span>
                    )}
                  </h2>
                  <p className="text-[rgb(var(--muted))] text-sm sm:text-base leading-relaxed mb-4">
                    {scenes[1].description}
                  </p>
                  {/* {scenes[1].button_label && (
                    <a
                      href={scenes[1].button_url ?? "#timeline"}
                      onClick={(e) => handleScrollToTimeline(e, scenes[1].button_url)}
                      className="inline-block bg-[rgb(var(--accent))] hover:opacity-90 text-[rgb(var(--bg))] font-bold px-6 py-2.5 rounded-xl transition duration-300 shadow-lg shadow-[rgb(var(--accent)/0.25)] text-xs sm:text-sm btn-sheen cursor-pointer"
                    >
                      {scenes[1].button_label}
                    </a>
                  )} */}
                </div>
              </div>
            )}

            {/* Scene 3: Teks Kanan */}
            {scenes[2] && (
              <div
                ref={text3Ref}
                className="absolute right-[8%] text-right max-w-[500px] z-20 will-change-transform pointer-events-auto"
              >
                <div>
                  {(scenes[2].badge_text || scenes[2].subtitle_code) && (
                    <span className="text-[rgb(var(--accent))] font-mono text-xs tracking-wider uppercase block mb-1">
                      {scenes[2].badge_text ?? scenes[2].subtitle_code}
                    </span>
                  )}
                  <h2 className="text-2xl sm:text-3xl font-black text-[rgb(var(--fg))] leading-tight mb-4">
                    {scenes[2].title_primary}{" "}
                    {scenes[2].title_highlight && (
                      <span className="text-[rgb(var(--accent))]">{scenes[2].title_highlight}</span>
                    )}
                  </h2>
                  <p className="text-[rgb(var(--muted))] text-sm sm:text-base leading-relaxed mb-4">
                    {scenes[2].description}
                  </p>
                  {scenes[2].button_label && scenes[2].button_url && (
                    <a
                      href={scenes[2].button_url}
                      className="inline-block bg-[rgb(var(--accent))] hover:opacity-90 text-[rgb(var(--bg))] font-bold px-6 py-2.5 rounded-xl transition duration-300 shadow-lg shadow-[rgb(var(--accent)/0.25)] text-xs sm:text-sm btn-sheen"
                    >
                      {scenes[2].button_label}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>

  );
}