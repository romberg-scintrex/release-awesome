# Design: Best Practice Improvements

## Overview

Dokumen ini menjelaskan keputusan teknis dan desain untuk setiap perbaikan. Semua perubahan bersifat non-visual — tidak ada perubahan pada tampilan, layout, atau UX yang terlihat oleh pengguna.

---

## Architecture

Semua perubahan dalam spec ini bersifat **incremental dan terisolasi** — setiap fix hanya menyentuh file yang relevan tanpa mengubah arsitektur keseluruhan aplikasi.

```
next.config.ts
└── CSP header update (REQ-BP1)

src/app/page.tsx
└── fetchPriority on preload link (REQ-P1)

src/components/
├── Layouts/
│   ├── HeroSection/index.tsx
│   │   └── dynamic import MaskRevealHero (REQ-P2)
│   ├── SliderDesktop/index.tsx
│   │   ├── add headingAs prop to SlideDesktopHeading (REQ-A2)
│   │   └── remove aria-current from tab button (REQ-BP2)
│   ├── Testimonials/index.tsx
│   │   └── add headingAs prop to TestimonialsHeading (REQ-A2)
│   └── MarqueeTech/index.tsx
│       └── add sr-only list fallback (REQ-A3)
└── Fragments/
    ├── HeroOverlay/index.tsx
    │   └── add role="img" to RoleTypewriter span (REQ-A1)
    └── HeroMobile/index.tsx
        └── add role="img" to RoleTypewriter span (REQ-A1)

[external tooling]
└── SonarQube via sonarcube.sh (REQ-QA1)
    ├── npm run test:coverage → coverage/lcov.info
    ├── docker sonar-scanner-cli → scan src/
    └── quality gate check: coverage ≥ 50%, bugs = 0, vulns = 0
```

### Prinsip arsitektur yang dipertahankan

- **No new dependencies** — semua fix menggunakan API bawaan HTML/ARIA dan fitur Next.js yang sudah ada (`next/dynamic`).
- **Backward compatible** — prop baru (`headingAs`) bersifat optional dengan default yang mempertahankan perilaku yang diinginkan. Pemanggil lama tidak perlu diubah.
- **Isolated changes** — setiap fix tidak mempengaruhi file lain. Tidak ada perubahan pada data layer, auth, atau admin panel.
- **SSR safe** — `MaskRevealHero` sudah tidak bisa di-SSR (WebGL), formalisasi dengan `ssr: false` pada `next/dynamic` tidak mengubah output server.

---

## Components and Interfaces

### RoleTypewriter (HeroOverlay + HeroMobile)

Tidak ada perubahan interface. Hanya penambahan atribut HTML pada elemen yang sudah ada.

**Before:**
```tsx
// src/components/Fragments/HeroOverlay/index.tsx
// src/components/Fragments/HeroMobile/index.tsx
function RoleTypewriter() {
  return (
    <span
      className="relative inline-flex h-6 overflow-hidden align-baseline"
      aria-label={ROLES.join(", ")}
    >
      <span aria-hidden className="role-roll flex flex-col">
        {/* animated roles */}
      </span>
    </span>
  );
}
```

**After:**
```tsx
function RoleTypewriter() {
  return (
    <span
      role="img"                                   // ← added
      className="relative inline-flex h-6 overflow-hidden align-baseline"
      aria-label={ROLES.join(", ")}
    >
      <span aria-hidden className="role-roll flex flex-col">
        {/* animated roles — unchanged */}
      </span>
    </span>
  );
}
```

---

### SlideDesktopHeading interface (SliderDesktop)

```tsx
// Before
interface SlideDesktopHeading {
  index?: string;
  eyebrow?: string;
  title: string;
  description?: string;
}

// After
interface SlideDesktopHeading {
  index?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  headingAs?: "h2" | "h3";  // ← added, default "h2" at call site
}
```

Usage in render (inside `SlideDesktop` component):
```tsx
// Before
<SectionHeading as="h3" ... />

// After
<SectionHeading as={heading.headingAs ?? "h2"} ... />
```

---

### TestimonialsHeading interface (Testimonials)

```tsx
// Before
interface TestimonialsHeading {
  index?: string;
  eyebrow?: string;
  title: string;
  description?: string;
}

// After
interface TestimonialsHeading {
  index?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  headingAs?: "h2" | "h3";  // ← added, default "h2" at call site
}
```

Usage in render (inside `Testimonials` component):
```tsx
// Before
<SectionHeading as="h3" ... />

// After
<SectionHeading as={heading.headingAs ?? "h2"} ... />
```

---

### MarqueeTech SR-only list

Tidak ada perubahan interface komponen. Penambahan JSX di dalam render.

```tsx
// Added inside <section>, before the visual marquee div
<ul className="sr-only" aria-label="Tech stack yang saya gunakan sehari-hari">
  {techMarquee.map((tech) => (
    <li key={tech.description}>
      <strong>{tech.description}</strong>: {tech.detail}
    </li>
  ))}
</ul>
```

`techMarquee` adalah array yang sudah ada di file yang sama — tidak ada prop baru, tidak ada data fetching.

---

### MaskRevealHero dynamic import

```tsx
// Before — HeroSection/index.tsx
import MaskRevealHero from "@/components/Fragments/MaskReveal";

// After
import dynamic from "next/dynamic";

const MaskRevealHero = dynamic(
  () => import("@/components/Fragments/MaskReveal"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[100svh] min-h-[640px] w-full bg-[rgb(var(--bg))]" />
    ),
  }
);
```

Interface `HeroSection` tidak berubah — komponen ini tidak menerima props.

---

### Tab button ARIA cleanup (SliderDesktop)

```tsx
// Before
<button
  role="tab"
  aria-selected={isActive}
  aria-current={isActive}   // ← invalid on role="tab"
  ...
>

// After
<button
  role="tab"
  aria-selected={isActive}  // only valid tab state attribute
  ...
>
```

---

### CSP update (next.config.ts)

```ts
// Before
const csp = [
  ...
  "img-src 'self' data: blob: *.supabase.co picsum.photos images.unsplash.com cdn.simpleicons.org",
  "connect-src 'self' *.supabase.co wss://*.supabase.co",
  ...
].join("; ");

// headers
{ key: "Content-Security-Policy-Report-Only", value: csp },

// After
const csp = [
  ...
  "img-src 'self' data: blob: *.supabase.co picsum.photos images.unsplash.com cdn.simpleicons.org upload.wikimedia.org",
  "connect-src 'self' *.supabase.co wss://*.supabase.co vitals.vercel-insights.com",
  ...
].join("; ");

// headers
{ key: "Content-Security-Policy", value: csp },
```

---

## Data Models

Spec ini tidak memperkenalkan data model baru. Tidak ada perubahan pada:
- Supabase schema atau tabel
- TypeScript domain types (`src/lib/types.ts`)
- Row mapping functions (`src/lib/queries.ts`)
- Admin input types (`src/lib/admin/types.ts`)
- Seed data (`src/lib/default.ts`)

Satu-satunya "data" yang terlibat adalah konstanta `ROLES` (array string) dan array `techMarquee` (array object `{image, description, detail}`), keduanya sudah ada di codebase dan tidak dimodifikasi strukturnya.

```ts
// Tidak berubah — src/lib/utils.ts
export const ROLES = [
  "Software Engineer",
  "Golang Developer",
  "Next JS Developer",
];

// Tidak berubah — src/components/Layouts/MarqueeTech/index.tsx
const techMarquee = [
  { image: string, description: string, detail: string },
  // ...
];
```

---

## Correctness Properties

Setiap perubahan harus memenuhi properti berikut setelah implementasi:

Property 1: `<span role="img" aria-label="...">` harus hadir di DOM untuk setiap instance `RoleTypewriter` — di HeroOverlay dan MobileHero. `aria-label` tidak boleh muncul pada `<span>` tanpa role.
**Validates: Requirements 1**

Property 2: Urutan heading di halaman home harus berurutan — `h1` muncul sebelum `h2`, dan tidak ada `h3` yang muncul tanpa didahului `h2` pada level yang sama dalam document outline.
**Validates: Requirements 2**

Property 3: `<ul class="sr-only">` dengan minimal satu `<li>` harus hadir di dalam section MarqueeTech sehingga screen reader dapat mengakses daftar teknologi.
**Validates: Requirements 3**

Property 4: Response header `content-security-policy` harus hadir pada semua HTTP response setelah CSP di-enforce. Header `content-security-policy-report-only` harus tidak ada setelah flip.
**Validates: Requirements 4**

Property 5: Tidak ada resource yang dimuat oleh halaman (scripts, images, fonts, frames) yang memicu CSP violation di browser console setelah CSP di-enforce.
**Validates: Requirements 4**

Property 6: `<link rel="preload" fetchpriority="high">` untuk `heroFrontURL` harus hadir di HTML output SSR pada route `/`.
**Validates: Requirements 6**

Property 7: Semua existing Vitest tests harus passing dan `npm run build` harus berhasil tanpa error baru setelah setiap perubahan.
**Validates: Requirements 8**

Property 8: `./sonarcube.sh` harus keluar dengan exit code `0` — semua quality target terpenuhi: coverage ≥ 50%, bugs = 0, vulnerabilities = 0, code smells < 30, duplication < 3%, critical issues = 0.
**Validates: Requirements 9**

---

## Error Handling

Spec ini tidak menambahkan code path yang bisa melempar exception baru. Namun beberapa skenario perlu diperhatikan:

### Dynamic import MaskRevealHero

`next/dynamic` menangani loading state secara internal. Jika chunk gagal dimuat (jaringan putus), Next.js akan menampilkan `loading` placeholder indefinitely — tidak ada crash. Ini adalah perilaku default yang dapat diterima untuk komponen non-critical seperti hero WebGL.

Tidak perlu menambahkan `error` prop pada `dynamic()` untuk spec ini.

### CSP Enforcement

Setelah flip ke enforcing, jika ada resource yang terblokir CSP, efeknya adalah:
- Resource tidak dimuat (misalnya gambar dari domain yang belum di-whitelist)
- Browser mencatat error di console
- **Tidak ada crash aplikasi** — Next.js dan React tidak throw error untuk blocked resources

Mitigation: Jalankan dengan CSP report-only di staging terlebih dahulu (Task 8) sebelum flip ke enforcing (Task 9).

### `fetchPriority` pada browser lama

Atribut `fetchPriority` adalah hint, bukan requirement. Browser yang tidak mendukungnya (Safari < 17.2) akan mengabaikannya dengan aman. Tidak ada fallback yang diperlukan.

### SonarQube scan gagal

`sonarcube.sh` dapat gagal karena beberapa skenario — masing-masing memiliki handling yang berbeda:

| Skenario | Pesan | Tindakan |
|----------|-------|----------|
| `.env.sonar` tidak ada | `ERROR: .env.sonar not found` | Buat file sesuai contoh di `.env.sonar.example` |
| `SONAR_TOKEN` kosong | `ERROR: SONAR_TOKEN is not set` | Isi token dari SonarQube → My Account → Security |
| SonarQube container tidak berjalan | Timeout setelah 90s | `docker start sonarqube` atau jalankan container baru |
| Quality gate tidak terpenuhi | `⚠️ N quality target(s) NOT met` | Lihat detail metric di dashboard, perbaiki issues |
| Coverage di bawah target | `❌ Coverage X% < 50%` | Tambah unit test untuk file yang belum ter-cover |
| Critical/Blocker issues > 0 | `❌ Critical Issues N > 0` | Perbaiki issues yang ditampilkan dalam output |

Script keluar dengan `exit 1` jika ada target yang tidak terpenuhi — ini bersifat **non-destructive**, tidak ada perubahan kode yang dilakukan oleh script.

Coverage report (`coverage/lcov.info`) harus dihasilkan sebelum menjalankan scan. Script sudah otomatis menjalankan `npm run test:coverage`, tapi jika ingin manual:
```bash
npm run test:coverage
./sonarcube.sh
```

---

## Testing Strategy

Spec ini berfokus pada perbaikan HTML/ARIA dan konfigurasi — tidak ada logic baru yang perlu unit test. Strategi testing mengikuti pendekatan berikut:

### Automated (existing tests — tidak diubah)
Semua test yang sudah ada harus tetap passing. Tidak ada test baru yang wajib dibuat untuk perubahan ini karena:
- Perubahan ARIA (`role="img"`, hapus `aria-current`, `headingAs` prop) adalah atribut HTML — diverifikasi via Lighthouse dan manual review, bukan unit test.
- Perubahan CSP adalah header HTTP — diverifikasi via browser DevTools.
- `fetchPriority` adalah HTML attribute hint — tidak memiliki observable runtime behavior yang bisa di-assert.

### Lighthouse Audit (manual — wajib)
Jalankan setelah semua task selesai:

```
Chrome DevTools → Lighthouse → Mobile
Target:
  Accessibility: 100
  Best Practices: ≥ 90
  Performance: ≥ 90
  SEO: 100
```

### Browser DevTools Checks (manual — wajib per task)

| Task | Check |
|------|-------|
| REQ-A1 | Elements panel → inspect `<span role="img" aria-label="...">` ada di hero rail |
| REQ-A2 | Accessibility tree (DevTools) → heading order h1 → h2 → h2 |
| REQ-A3 | Elements panel → `<ul class="sr-only">` ada di dalam `<section>` MarqueeTech |
| REQ-BP1 | Network tab → response headers → `content-security-policy` hadir, tidak ada violation di console |
| REQ-BP2 | Elements panel → tab buttons tidak memiliki `aria-current` attribute |
| REQ-P1 | Network tab → filter "preload" → heroFrontURL memiliki priority "Highest" |
| REQ-P2 | Network tab → chunk terpisah untuk MaskReveal dimuat setelah initial JS |

### Screen Reader (manual — optional tapi direkomendasikan)

Test REQ-A1 dan REQ-A2 dengan VoiceOver (macOS) atau NVDA (Windows):
- REQ-A1: VoiceOver harus mengumumkan "Software Engineer, Golang Developer, Next JS Developer" saat fokus mencapai area role typewriter
- REQ-A2: Navigasi heading (VoiceOver: ⌃⌥H) harus menampilkan h1 → h2 → h2, tanpa h3 orphan

### SonarQube (automated — wajib di akhir semua task)

SonarQube dijalankan sebagai tahap verifikasi final setelah semua implementasi selesai.

**Alur lengkap**:
```bash
# 1. Pastikan SonarQube container berjalan
docker ps --filter name=sonarqube

# Jika belum jalan:
docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-community

# 2. Pastikan .env.sonar tersedia
# Lihat .env.sonar.example untuk format

# 3. Generate coverage + scan + quality check (satu perintah)
./sonarcube.sh

# 4. Atau jika scan sudah berjalan sebelumnya, cukup quality check
./sonarcube.sh --check-only
```

**Quality targets** yang dikonfigurasi di `sonarcube.sh`:

| Metric | Target | Konfigurasi |
|--------|--------|-------------|
| Coverage | ≥ 50% | `TARGET_COVERAGE=50` |
| Bugs | 0 | `TARGET_BUGS=0` |
| Vulnerabilities | 0 | `TARGET_VULNERABILITIES=0` |
| Code Smells | < 30 | `TARGET_CODE_SMELLS=30` |
| Duplication | < 3% | `TARGET_DUPLICATION=3` |
| Critical Issues | 0 | checked via `/api/issues/search` |

**Coverage scope**: SonarQube menggunakan `coverage/lcov.info` dari Vitest. Exclusions di `sonar-project.properties` sudah align dengan exclusions di `vitest.config.ts` — file layout, page, Icons, Providers, dan komponen presentasional tidak masuk hitungan coverage.

**Interpretasi hasil**:
- Exit code `0` → semua target terpenuhi, siap deploy
- Exit code `1` → ada target yang tidak terpenuhi, lihat output untuk detail
- Dashboard lokal: `http://localhost:9000/dashboard?id=release-awesome_0000`
