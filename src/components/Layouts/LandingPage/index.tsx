'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Code2, Layers } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// 1. Tipe data struktur tenant
export interface TenantData {
  name?: string;
  subdomain?: string;
  tagline?: string;
  description?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  skills?: string[];
  stats?: {
    label: string;
    value: string;
  }[];
}

// 2. Menerima 'tenant' object atau flat properties
export type HeroSectionProps = {
  tenant?: TenantData;
} & TenantData;

export const LandingPage: React.FC<HeroSectionProps> = ({ tenant, ...flatProps }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Konsolidasi data dari prop 'tenant' atau flat props
  const activeTenant = tenant || flatProps;

  // Fallback data
  const displayData = {
    name: activeTenant?.name || 'Creative Developer',
    subdomain: activeTenant?.subdomain || 'creative-space',
    description:
      activeTenant?.description ||
      'Membangun pengalaman web imersif kelas dunia dengan performa tinggi, 3D WebGL interaktif, dan arsitektur modern.',
    primaryCtaText: activeTenant?.primaryCtaText || 'Lihat Projek Unggulan',
    primaryCtaLink: activeTenant?.primaryCtaLink || '#projects',
    secondaryCtaText: activeTenant?.secondaryCtaText || 'Mulai Kolaborasi',
    secondaryCtaLink: activeTenant?.secondaryCtaLink || '#contact',
    stats: activeTenant?.stats || [
      { value: '50+', label: 'Projek Berhasil' },
      { value: '5★', label: 'Review Klien' },
      { value: '100%', label: 'Optimal WebGL FPS' },
    ],
    skills: activeTenant?.skills || ['Three.js', 'GSAP', 'Next.js 15', 'Tailwind', 'Supabase'],
  };

  // Setup GSAP Entrance Animation
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('.hero-badge', { y: -30, opacity: 0, duration: 0.8, delay: 0.2 })
        .from('.hero-title', { y: 40, opacity: 0, duration: 1 }, '-=0.4')
        .from('.hero-desc', { y: 25, opacity: 0, duration: 0.8 }, '-=0.6')
        .from('.hero-cta', { scale: 0.9, opacity: 0, duration: 0.6, stagger: 0.15 }, '-=0.4')
        .from('.hero-skills span', { opacity: 0, y: 15, stagger: 0.08, duration: 0.5 }, '-=0.4')
        .from('.hero-stat-card', { y: 30, opacity: 0, stagger: 0.15, duration: 0.7 }, '-=0.5');
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 text-slate-100 pt-24 pb-16 px-4 sm:px-6"
    >

      <div className="container mx-auto max-w-5xl z-10">
        <div className="flex flex-col items-center text-center space-y-8">
          
          {/* Tenant Badge */}
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/80 backdrop-blur-md text-xs sm:text-sm text-slate-300 shadow-lg">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Portofolio Ruang: @{displayData.subdomain}</span>
          </div>

          {/* Heading */}
          <h1 className="hero-title text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.15]">
            Menciptakan Dimensi Baru Bersama{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              {displayData.name}
            </span>
          </h1>

          {/* Deskripsi */}
          <p className="hero-desc max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
            {displayData.description}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-2">
            <Link
              href={displayData.primaryCtaLink}
              className="hero-cta w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:scale-105"
            >
              <span>{displayData.primaryCtaText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href={displayData.secondaryCtaLink}
              className="hero-cta w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 hover:text-white font-medium text-sm backdrop-blur-md transition-all hover:scale-105"
            >
              <Layers className="w-4 h-4 text-slate-400" />
              <span>{displayData.secondaryCtaText}</span>
            </Link>
          </div>

          {/* Tech Stack Pills */}
          <div className="hero-skills pt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-medium mr-1 flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5" /> Stack:
            </span>
            {displayData.skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-lg text-xs font-mono bg-slate-900/80 border border-slate-800 text-cyan-300 shadow-sm"
              >
                {skill}
              </span>
            ))}
          </div>

          {/* Stat Cards */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-slate-900 max-w-3xl">
            {displayData.stats.map((stat, idx) => (
              <div
                key={idx}
                className="hero-stat-card flex flex-col items-center p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md"
              >
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-slate-400 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default LandingPage;