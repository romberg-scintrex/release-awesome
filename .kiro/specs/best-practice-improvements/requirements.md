# Requirements Document

## Introduction

Perbaikan berdasarkan hasil Lighthouse audit pada halaman publik portfolio (https://release-awesome.vercel.app). Tujuan utama adalah meningkatkan skor Accessibility dari 94 ke 100, Best Practices dari 73 ke 90+, dan Performance dari 77 ke 90+, tanpa mengubah tampilan visual atau UX yang sudah ada.

## Current Scores

| Category | Current | Target |
|----------|---------|--------|
| Performance | 77 | ≥ 90 |
| Accessibility | 94 | 100 |
| Best Practices | 73 | ≥ 90 |
| SEO | 100 | 100 (pertahankan) |

## Requirements

### 1. Accessibility — ARIA yang valid

**ID**: REQ-A1  
**Priority**: Must Have

Setiap elemen yang menggunakan atribut `aria-label` harus memiliki role yang valid. Atribut `aria-label` tidak dapat digunakan pada elemen `<span>` tanpa explicit role.

**Acceptance Criteria**:
- Komponen `RoleTypewriter` di `HeroOverlay` dan `HeroMobile` tidak lagi memicu Lighthouse violation "Elements use prohibited ARIA attributes"
- Screen reader dapat membaca daftar role ("Software Engineer, Golang Developer, Next JS Developer") sebagai teks deskriptif
- Tampilan visual tidak berubah — animasi typewriter tetap berjalan normal

---

### 2. Accessibility — Urutan heading berurutan

**ID**: REQ-A2  
**Priority**: Must Have

Struktur heading pada setiap halaman harus berurutan secara hierarki (H1 → H2 → H3) tanpa melewati level. Heading yang melewati level merusak navigasi screen reader.

**Acceptance Criteria**:
- Halaman home tidak lagi memiliki `<h3>` yang muncul langsung setelah `<h1>` tanpa ada `<h2>` di antaranya
- Section "Thoughts worth shipping" (SliderDesktop) menggunakan `<h2>` sebagai level heading utama section
- Section "What people I've worked with say" (Testimonials) menggunakan `<h2>` sebagai level heading utama section
- Komponen `SliderDesktop` dan `Testimonials` mendukung prop untuk mengkonfigurasi heading level, sehingga bisa digunakan sebagai `<h3>` ketika berada di dalam halaman yang sudah memiliki `<h2>`
- Tidak ada Lighthouse violation "Heading elements are not in a sequentially-descending order"

---

### 3. Accessibility — Screen reader fallback untuk konten animasi

**ID**: REQ-A3  
**Priority**: Should Have

Konten informatif yang disajikan secara visual melalui animasi (marquee, carousel) harus tetap dapat diakses oleh screen reader melalui elemen tersembunyi yang setara.

**Acceptance Criteria**:
- Komponen `MarqueeTech` menyediakan list tersembunyi (`sr-only`) yang berisi nama dan deskripsi setiap teknologi
- List tersembunyi memiliki label yang jelas untuk screen reader
- Elemen marquee yang bersifat dekoratif tetap menggunakan `aria-hidden`

---

### 4. Best Practices — Content Security Policy aktif

**ID**: REQ-BP1  
**Priority**: Must Have

Situs harus memiliki Content Security Policy yang aktif (enforcing), bukan hanya report-only. CSP enforcing meningkatkan keamanan dan skor Lighthouse Best Practices.

**Acceptance Criteria**:
- Header `Content-Security-Policy-Report-Only` diganti dengan `Content-Security-Policy` di `next.config.ts`
- Tidak ada resource yang diblokir oleh CSP setelah pergantian (diverifikasi di browser console dan Vercel logs)
- `img-src` directive mencakup `upload.wikimedia.org` untuk AWS logo di marquee
- Semua fitur halaman tetap berfungsi: Three.js WebGL, Framer Motion inline styles, Cloudflare Turnstile iframe, Supabase connections

---

### 5. Best Practices — ARIA role yang tepat pada tab button

**ID**: REQ-BP2  
**Priority**: Should Have

Elemen `<button>` dengan `role="tab"` tidak boleh menggunakan atribut `aria-current`. Atribut ini tidak valid untuk role tab — gunakan hanya `aria-selected`.

**Acceptance Criteria**:
- Komponen `SliderDesktop` menghapus `aria-current` dari button yang memiliki `role="tab"`
- Tab button tetap menggunakan `aria-selected={isActive}` untuk menandai tab aktif
- Fungsi navigasi carousel tidak berubah

---

### 6. Performance — Preload hero images optimal

**ID**: REQ-P1  
**Priority**: Should Have

Semua aset hero yang kritikal untuk LCP (Largest Contentful Paint) harus di-preload dengan prioritas tinggi.

**Acceptance Criteria**:
- `heroFrontURL` (foreground cutout `.avif`) mendapat atribut `fetchPriority="high"` pada tag preload
- `heroBackURL` sudah memiliki `fetchPriority="high"` (sudah ada, pertahankan)
- Preload hanya aktif untuk viewport `(min-width: 768px)` karena mobile menggunakan hero berbeda

---

### 7. Performance — Lazy load MaskRevealHero

**ID**: REQ-P2  
**Priority**: Should Have

Komponen `MaskRevealHero` yang mengandung kode Three.js harus di-lazy load menggunakan `next/dynamic` untuk memastikan chunk WebGL tidak masuk bundle awal halaman.

**Acceptance Criteria**:
- `MaskRevealHero` di-import menggunakan `next/dynamic` dengan opsi `{ ssr: false }` dari `HeroSection`
- Halaman tetap menampilkan hero section tanpa layout shift yang signifikan
- Build menghasilkan chunk terpisah untuk MaskRevealHero

---

### 8. Non-functional: Tidak ada regresi visual atau fungsional

**ID**: REQ-NF1  
**Priority**: Must Have

Semua perubahan harus mempertahankan tampilan dan fungsionalitas yang sudah ada.

**Acceptance Criteria**:
- Semua test yang ada tetap passing (`npm run test`)
- Build berhasil tanpa error (`npm run build`)
- Tidak ada TypeScript error (`npm run typecheck`)
- Animasi hero (fluid reveal, role typewriter, underline SVG) tetap berjalan normal
- Dark mode dan light mode tetap berfungsi dengan benar

---

### 9. Quality Gate — SonarQube analysis lulus

**ID**: REQ-QA1  
**Priority**: Must Have

Setelah semua implementasi selesai, hasil SonarQube scan harus memenuhi semua quality target yang sudah dikonfigurasi di `sonarcube.sh`. SonarQube dijalankan lokal via Docker dan menggunakan coverage report dari `npm run test:coverage`.

**Prerequisites**:
- Docker Desktop berjalan
- SonarQube container berjalan: `docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-community`
- File `.env.sonar` berisi `SONAR_TOKEN` dan `SONAR_HOST_URL=http://localhost:9000`
- Project `release-awesome_0000` sudah dibuat di SonarQube dashboard

**Acceptance Criteria**:
- `./sonarcube.sh` berjalan tanpa error dan keluar dengan exit code `0`
- Coverage ≥ 50% (diukur dari `coverage/lcov.info` yang dihasilkan `npm run test:coverage`)
- Bugs = 0
- Vulnerabilities = 0
- Code Smells < 30
- Duplication < 3%
- Critical/Blocker issues = 0
- Quality Gate status: **PASSED**

**Cara menjalankan**:
```bash
# Generate coverage report terlebih dahulu
npm run test:coverage

# Jalankan full scan + quality check
./sonarcube.sh

# Atau hanya quality check (tanpa scan ulang)
./sonarcube.sh --check-only
```

**Dashboard**: `http://localhost:9000/dashboard?id=release-awesome_0000`

## Glossary

| Istilah | Definisi |
|---------|----------|
| **Lighthouse** | Alat audit performa dan kualitas web bawaan Chrome DevTools yang mengukur Performance, Accessibility, Best Practices, dan SEO |
| **LCP (Largest Contentful Paint)** | Metrik Core Web Vitals yang mengukur waktu render elemen konten terbesar di viewport — target ≤ 2.5 detik |
| **CSP (Content Security Policy)** | HTTP header keamanan yang membatasi sumber daya yang boleh dimuat browser, mencegah XSS dan serangan injeksi |
| **ARIA (Accessible Rich Internet Applications)** | Spesifikasi W3C untuk menambahkan semantik aksesibilitas pada elemen HTML agar dapat dibaca screen reader |
| **`aria-label`** | Atribut ARIA yang memberikan label teks pada elemen yang tidak memiliki teks terlihat |
| **`aria-selected`** | Atribut ARIA untuk menandai item yang sedang dipilih dalam widget seperti tab, listbox, atau tree |
| **`aria-current`** | Atribut ARIA untuk menandai item yang merepresentasikan halaman atau langkah aktif saat ini — tidak valid pada role `tab` |
| **`aria-hidden`** | Atribut ARIA yang menyembunyikan elemen dari accessibility tree sehingga screen reader mengabaikannya |
| **`sr-only`** | Kelas Tailwind CSS yang menyembunyikan elemen secara visual namun tetap dapat dibaca oleh screen reader |
| **ISR (Incremental Static Regeneration)** | Fitur Next.js untuk regenerasi halaman statis di background dengan interval tertentu (`revalidate`) |
| **`next/dynamic`** | API Next.js untuk lazy loading komponen dengan code splitting, mendukung opsi `ssr: false` untuk komponen browser-only |
| **`fetchPriority`** | Atribut HTML yang memberi petunjuk prioritas pengunduhan resource kepada browser (`high`, `low`, `auto`) |
| **Three.js** | Library JavaScript untuk rendering grafis 3D berbasis WebGL yang digunakan pada efek fluid simulation hero desktop |
| **Framer Motion** | Library animasi React yang digunakan untuk transisi halaman dan animasi komponen |
| **WebGL** | API browser untuk rendering grafis GPU-accelerated langsung di canvas HTML |
| **SonarQube** | Platform analisis kualitas kode statis yang mengukur bug, vulnerability, code smell, duplikasi, dan coverage |
| **Quality Gate** | Sekumpulan kondisi minimum di SonarQube yang harus terpenuhi agar build dianggap lulus standar kualitas |
| **Screen Reader** | Teknologi asistif yang membaca konten layar secara audio untuk pengguna dengan gangguan penglihatan |
| **`role="tab"`** | ARIA role yang menandai elemen sebagai tab dalam pola navigasi tablist |
| **Marquee** | Teknik animasi CSS/JS untuk menampilkan konten bergerak horizontal secara terus-menerus |
