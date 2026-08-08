# Design

## Visual Identity

Dark-first portfolio with a cinematic, editorial feel. The hero uses a WebGL fluid mask-reveal effect on desktop and a full-bleed editorial layout on mobile. Typography leans on weight and tracking rather than decorative elements.

## Color System

### Neutrals (`ink-*`)
| Token | Hex | Usage |
|-------|-----|-------|
| `ink-950` | #050505 | Primary text (dark bg) |
| `ink-900` | #0a0a0a | Card backgrounds (dark) |
| `ink-800` | #111111 | Input backgrounds (dark) |
| `ink-500` | #3f3f3f | Secondary text |
| `ink-400` | #737373 | Muted/label text |
| `ink-200` | #d4d4d4 | Borders (light) |
| `ink-100` | #f5f5f5 | Surface light |
| `ink-50` | #fafafa | Page background (light) |

### Accent (violet)
- `accent` / `accent-400` — #a78bfa (light mode)
- `accent-500` — #8b5cf6 — primary brand violet
- Scale: `accent-50` through `accent-700`

### Brand palette
| Token | Hex |
|-------|-----|
| `brand-violet` | #8b5cf6 |
| `brand-fuchsia` | #d946ef |
| `brand-rose` | #fb7185 |
| `brand-amber` | #fbbf24 |
| `brand-cyan` | #22d3ee |
| `brand-emerald` | #34d399 |

### CSS custom properties (`globals.css`)
```css
/* Light */         /* Dark */
--bg: 250 250 250;  --bg: 5 5 5;
--fg: 5 5 5;        --fg: 245 245 245;
--muted: 115 115 115;
--border: 0 0 0 / 0.08;   --border: 255 255 255 / 0.08;
--card: 255 255 255;       --card: 17 17 17;
--accent: 139 92 246;      --accent: 167 139 250;
```

Use as: `bg-[rgb(var(--bg))]`, `text-[rgb(var(--fg))]`, `border-[rgb(var(--border))]`

## Typography

| Variable | Font | Usage |
|----------|------|-------|
| `--font-geist-sans` | Geist Sans | Body text (`font-sans`) |
| `--font-geist-mono` | Geist Mono | Code, labels, mono (`font-mono`) |
| `--font-display` | Outfit | Headings, hero name (`font-display`) |

### Fluid sizes (tailwind.config.ts)
```
text-fluid-hero → clamp(2.5rem, 10vw, 8rem)
text-fluid-h1   → clamp(2rem, 6vw, 5rem)
text-fluid-h2   → clamp(1.75rem, 4vw, 3.5rem)
text-fluid-h3   → clamp(1.25rem, 2.5vw, 2rem)
```

## Dark Mode

- Class-based via `next-themes`, `defaultTheme="dark"`.
- Always pair light/dark values: `bg-white dark:bg-ink-900`.
- CSS vars auto-swap in `.dark` — prefer vars over hardcoded values for surfaces.
- ThemeProvider wraps the entire app in root layout.

## Spacing & Layout

- Mobile-first. Tailwind breakpoints: `sm` (640) `md` (768) `lg` (1024) `xl` (1280) `2xl` (1400px container max).
- Container: centered, padding `1.25rem` → `1.5rem` → `2rem`, max-width `1400px`.
- Use `.container` class for content width. Carousels and full-bleed sections intentionally break out.

## Component Utilities

### `cn()` — always use for conditional classes
```typescript
import { cn } from "@/lib/utils";
className={cn("base", condition && "extra", className)}
```

### Glass morphism
```
.glass        → backdrop-blur-xl, border border-white/10, bg-white/5
.glass-strong → backdrop-blur-2xl, border border-white/15, bg-white/10
```

### Text gradients
```
.text-gradient      → violet → fuchsia → rose (bg-clip-text)
.text-gradient-cool → cyan → violet → fuchsia
.text-gradient-hero → animated shimmer for hero display name
.text-gradient-strong → deep saturated violet → magenta → rose
```

### Noise texture
```
.noise → pseudo-element with SVG fractalNoise, mix-blend-mode overlay
```

### Grid background
```
.grid-bg → 56px × 56px faint line grid
```

## Animations

All animations have `prefers-reduced-motion` alternatives — either `animation: none` or `opacity: 0 → 1` fallback.

| Tailwind class | Effect | Duration |
|----------------|--------|----------|
| `animate-fade-up` | fade + translateY(20px→0) | 0.6s |
| `animate-fade-in` | opacity 0→1 | 0.5s |
| `animate-float` | bob ±12px | 6s loop |
| `animate-marquee` | horizontal scroll (-50%) | 30s loop |
| `animate-blob` | organic translate + scale | 14s loop |
| `animate-pulse-ring` | scale 1→2.2, opacity 0.6→0 | 2s loop |
| `animate-spin-slow` | 360° rotation | 20s loop |
| `animate-shine` | sheen sweep | 3s loop |

### Hero-specific CSS
- `.role-roll` — CSS-driven vertical role name typewriter (`--role-rh`, `--role-dur` vars)
- `.marquee-track` — hero background marquee (`.line-1` 30s, `.line-2` 60s)
- `.btn-sheen` — light sheen sweep on hover via `::after` pseudo-element
- `.page-enter` — per-route fade-up enter animation (CSS-only, no AnimatePresence)

## Hero Design

### Desktop (≥ md)
- `MaskRevealHero` — WebGL Three.js fluid simulation. Cursor drives a gaussian splat that reveals a foreground cutout over a background texture.
- `HeroOverlay` — bottom rail with name + animated role typewriter + social icons + CTA buttons.
- Warm cream stage in light mode (`#fcfbf6` → `#e0d9c5`), deep purple-ink in dark (`#1d172d` → `#07060f`).

### Mobile (< md)
- `MobileHero` — full-bleed image with big initial letter behind the figure, floor scrim for name readability.
- Bottom rail with role typewriter + social links + CTA buttons.
- Same warm/dark theming as desktop.

## Navbar

- Fixed pill navbar at `top-4`, auto-hides on scroll down (>80px), reappears on scroll up.
- Scroll progress thread at bottom edge (violet → fuchsia → rose gradient).
- Mobile: hamburger menu drops a sheet below the pill.
- CommandPalette: ⌘K / Ctrl+K opens a search overlay (navigate, actions, social). **Not mounted on `/admin` routes.**

## Admin UI Conventions

- Admin uses the same `ink-*` color scale and dark mode.
- Cards: `rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-ink-900`.
- Inputs: `rounded-xl border border-black/10 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-accent/40 dark:bg-ink-800`.
- No Navbar, Footer, or CommandPalette in admin — `SiteFrame` early-returns bare children for `/admin` routes.
- `not-found.tsx` detects `/admin` pathname → shows "Back to Dashboard" instead of "Back to Home".
