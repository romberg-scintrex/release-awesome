# Implementation Plan: Best Practice Improvements

## Overview

Perbaikan best practice untuk portfolio site, mencakup aksesibilitas (ARIA), performa (preload, dynamic import), keamanan (CSP enforcement), dan quality gate (Lighthouse + SonarQube). Urutan pengerjaan berdasarkan prioritas dan dependencies antar task.

## Tasks

- [x] 1. Fix `aria-label` pada RoleTypewriter
  - **Refs**: REQ-A1
  - **Files**: `src/components/Fragments/HeroOverlay/index.tsx`, `src/components/Fragments/HeroMobile/index.tsx`
  - [x] 1.1 Tambahkan `role="img"` pada outer `<span>` di fungsi `RoleTypewriter` dalam `HeroOverlay/index.tsx`
  - [x] 1.2 Tambahkan `role="img"` pada outer `<span>` di fungsi `RoleTypewriter` dalam `HeroMobile/index.tsx`
  - [ ] 1.3 Jalankan `npm run typecheck` — pastikan tidak ada error
  - [ ] 1.4 Jalankan `npm run test` — pastikan semua test passing

- [ ] 2. Fix heading order di SliderDesktop
  - **Refs**: REQ-A2
  - **Files**: `src/components/Layouts/SliderDesktop/index.tsx`
  - [x] 2.1 Tambahkan prop `headingAs?: "h2" | "h3"` pada interface `SlideDesktopHeading`
  - [x] 2.2 Teruskan prop ke `<SectionHeading as={heading.headingAs ?? "h2"} />` — ganti dari hardcoded `"h3"`
  - [ ] 2.3 Jalankan `npm run typecheck`

- [x] 3. Fix heading order di Testimonials
  - **Refs**: REQ-A2
  - **Files**: `src/components/Layouts/Testimonials/index.tsx`
  - [x] 3.1 Tambahkan prop `headingAs?: "h2" | "h3"` pada interface `TestimonialsHeading`
  - [x] 3.2 Teruskan prop ke `<SectionHeading as={heading.headingAs ?? "h2"} />` — ganti dari hardcoded `"h3"`
  - [x] 3.3 Jalankan `npm run typecheck`

- [x] 4. Hapus `aria-current` dari tab button di SliderDesktop
  - **Refs**: REQ-BP2
  - **Files**: `src/components/Layouts/SliderDesktop/index.tsx`
  - [ ] 4.1 Hapus atribut `aria-current={isActive}` dari `<button role="tab" ...>`
  - [ ] 4.2 Pastikan `aria-selected={isActive}` tetap ada
  - [ ] 4.3 Jalankan `npm run typecheck`

- [x] 5. Tambahkan SR-only fallback di MarqueeTech
  - **Refs**: REQ-A3
  - **Files**: `src/components/Layouts/MarqueeTech/index.tsx`
  - [ ] 5.1 Tambahkan `<ul className="sr-only" aria-label="Tech stack yang saya gunakan sehari-hari">` di dalam `<section>`, sebelum marquee div
  - [ ] 5.2 Render setiap item dari array `techMarquee` sebagai `<li>` dengan nama dan deskripsi teknologi
  - [ ] 5.3 Pastikan marquee `<div aria-hidden>` tetap tidak berubah
  - [ ] 5.4 Jalankan `npm run typecheck`

- [x] 6. Tambahkan `fetchPriority` pada hero front image preload
  - **Refs**: REQ-P1
  - **Files**: `src/app/page.tsx`
  - [ ] 6.1 Tambahkan `fetchPriority="high"` pada `<link rel="preload">` untuk `heroFrontURL`
  - [ ] 6.2 Jalankan `npm run build` dan periksa tidak ada warning terkait preload

- [x] 7. Dynamic import MaskRevealHero
  - **Refs**: REQ-P2
  - **Files**: `src/components/Layouts/HeroSection/index.tsx`
  - [x] 7.1 Ubah import static `MaskRevealHero` menjadi `next/dynamic` dengan `ssr: false`
  - [x] 7.2 Tambahkan `loading` prop berupa placeholder div dengan tinggi yang sama (`h-[100svh] min-h-[640px] w-full bg-[rgb(var(--bg))]`)
  - [x] 7.3 Hapus import static lama
  - [x] 7.4 Jalankan `npm run build` — verifikasi chunk terpisah terbentuk untuk MaskReveal
  - [x] 7.5 Jalankan `npm run typecheck`

- [x] 8. Update CSP img-src dan connect-src
  - **Refs**: REQ-BP1 (persiapan)
  - **Files**: `next.config.ts`
  - [x] 8.1 Tambahkan `upload.wikimedia.org` ke directive `img-src`
  - [x] 8.2 Tambahkan `vitals.vercel-insights.com` ke directive `connect-src`
  - [x] 8.3 Jalankan `npm run build`

- [x] 9. Flip CSP dari Report-Only ke Enforcing
  - **Refs**: REQ-BP1
  - **Files**: `next.config.ts`
  - **Depends on**: Task 8
  - [x] 9.1 Ganti header key dari `"Content-Security-Policy-Report-Only"` menjadi `"Content-Security-Policy"`
  - [x] 9.2 Jalankan `npm run build`

- [-] 10. Lighthouse verification & skor final
  - **Refs**: REQ-NF1
  - **Depends on**: Task 1, Task 2, Task 3, Task 4, Task 5, Task 6, Task 7, Task 9
  - [x] 10.1 Jalankan `npm run test` — semua passing
  - [ ] 10.2 Jalankan `npm run typecheck` — zero errors
  - [ ] 10.3 Jalankan `npm run lint` — zero violations
  - [ ] 10.4 Jalankan `npm run build` — build sukses

- [ ] 11. SonarQube scan & quality gate
  - **Refs**: REQ-QA1
  - **Depends on**: Task 10
  - [ ] 11.1 Pastikan SonarQube container berjalan: `docker ps --filter name=sonarqube`
  - [ ] 11.2 Jalankan scan lengkap: `./sonarcube.sh`
  - [ ] 11.3 Verifikasi output: `✅ ALL QUALITY TARGETS MET!` dan exit code 0

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": [1, 2, 3, 4, 5, 6, 7, 8],
      "description": "Independent accessibility, performance, and CSP prep fixes"
    },
    {
      "wave": 2,
      "tasks": [9],
      "description": "CSP enforce — depends on Task 8"
    },
    {
      "wave": 3,
      "tasks": [10],
      "description": "Lighthouse verification gate — depends on all prior tasks"
    },
    {
      "wave": 4,
      "tasks": [11],
      "description": "SonarQube quality gate — depends on Task 10"
    }
  ]
}
```

## Notes

- Tasks 1–5 are accessibility fixes; they should be tackled first as they have no dependencies and directly impact the Lighthouse Accessibility score target of 100.
- Task 8 must be deployed and monitored before flipping to enforcing CSP in Task 9 — do not skip the staging verification step.
- Task 10 and 11 are verification-only tasks; no new code is written. They serve as the acceptance gate for the entire spec.
- SonarQube (Task 11) requires Docker Desktop running locally. Ensure `./sonarcube.sh` is executable (`chmod +x sonarcube.sh`) before running.
