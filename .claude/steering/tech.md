# Tech

Read before writing code. Baseline: branch `development`.

## Stack

| Concern | Choice | Version | Notes |
|---------|--------|---------|-------|
| Framework | Next.js, App Router | `^16.2.12` | Turbopack is the default for `dev` **and** `build` |
| UI | React + React DOM | `^19.2.8` | App Router runs a React canary including 19.2 features |
| Language | TypeScript | `^5` | `strict: true`. No `any` without a written justification |
| Styling | Tailwind CSS | `4.3.3` | via `@tailwindcss/postcss`; JS config loaded by `@config` |
| Database / Auth / Storage | Supabase | `@supabase/ssr ^0.12.4` | Postgres + RLS |
| Email | Resend | `^6.18.1` | contact form only |
| CAPTCHA | Cloudflare Turnstile | — | server-verified |
| 3D | Three.js | `^0.185.1` | hand-written `FluidSimulation` class, no React wrapper |
| Animation | Framer Motion, GSAP, Lenis | `^12.43`, `^3.15`, `^1.3.25` | three animation systems coexist — see [decisions.md ADR-009](./decisions.md#adr-009--three-animation-libraries-coexist) |
| Testing | Vitest + Testing Library + jsdom + fast-check | `4.1.10` | `fast-check` installed, **no property test written yet** |
| Lint | ESLint flat config | `^9` | `eslint-config-next` 16 exports flat arrays |
| Deploy | Vercel | — | Node.js `>=20` |

### Installed but unused

Shipping dependency weight for no current feature. Either build the feature or
remove the dependency — do not leave it ambiguous:

`@faker-js/faker`, `@imgly/background-removal`, `bcryptjs`, `cron-parser`,
`cronstrue`, `diff`, `js-yaml`, `qrcode`, `browser-image-compression`,
`sql-formatter`, `tesseract.js`, `react-markdown`, `rehype-highlight`,
`remark-gfm`.

> **`casbin` was removed on 2026-11-01** — see
> [ADR-018](./decisions.md#adr-018--remove-casbin). It governed navbar
> visibility only, computed the same answer for every user, and left a newly
> registered tenant unable to edit its own portfolio.
>
> **`bcryptjs` deserves a second look**: Supabase Auth hashes passwords
> server-side, so an app-level bcrypt is most likely vestigial.

Most belong to [`specs/embedded-tools-platform`](../specs/embedded-tools-platform/requirements.md);
the Markdown trio belongs to the blog, which is a `notFound()` stub.

---

## Next.js 16 — breaking changes that bind this codebase

Verified against `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`.
**Your training data probably predates these.** Read the local docs before
writing router code.

| Change | What it means here |
|--------|--------------------|
| `middleware.ts` → **`proxy.ts`** | The file is `src/proxy.ts`, the export is `proxy`. `edge` runtime is **not supported**; the runtime is `nodejs` and not configurable. Flags renamed: `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`. |
| **Async request APIs — synchronous access removed** | `cookies()`, `headers()`, `draftMode()`, and `params` / `searchParams` in `page`, `layout`, `route`, `default`, and all metadata image files **must be awaited**. There is no compatibility shim any more. |
| `opengraph-image` / `icon` params are Promises | In `src/app/opengraph-image.tsx`, `params` and `id` must be awaited. `generateImageMetadata` still receives sync `params`. |
| `sitemap` `id` is a Promise | Relevant when `sitemap.ts` gets written. |
| **Turbopack by default** | No `--turbopack` flag needed. A custom `webpack` config makes `next build` **fail**; opt out with `--webpack`. `experimental.turbopack` is now top-level `turbopack`. |
| `revalidateTag` needs a second argument | `revalidateTag("posts", "max")`. One-argument form is a TS error. This repo uses `revalidatePath` only. |
| `updateTag` is new | Server-Action-only, read-your-writes. Prefer it for admin mutations where the editor must see their own change immediately. |
| `cacheLife` / `cacheTag` stable | Drop the `unstable_` prefix. |
| PPR flag removed | `experimental.ppr` and `experimental_ppr` are gone. The successor is `cacheComponents: true`, which behaves differently. Do not enable casually. |
| `scroll-behavior` no longer overridden | Root `<html>` has `data-scroll-behavior="smooth"` to restore the old behaviour. **Do not remove it.** |
| Parallel routes need explicit `default.js` | Builds fail without it. No parallel routes exist yet. |
| `next dev` writes to `.next/dev` | Separate output dirs let `dev` and `build` run concurrently. |
| `next/image` defaults changed | `minimumCacheTTL` 60s → **4h**; `16` removed from `imageSizes`; `qualities` defaults to `[75]` only; local IPs blocked; max 3 redirects. Local images with query strings now need `images.localPatterns.search`. |
| `images.domains` deprecated | Use `remotePatterns` — this repo already does. |

### `next typegen`

`npx next typegen` generates `PageProps<'/route'>`, `LayoutProps`, and
`RouteContext` helpers. Use them for new dynamic routes instead of hand-written
`{ params: Promise<{ slug: string }> }`:

```tsx
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params
  // ...
}
```

---

## Conventions

### TypeScript

- `strict` is on. `interface` for object shapes, `type` for unions and
  intersections — follow `src/lib/types.ts`.
- **Named exports everywhere.** Default exports only where Next.js demands them:
  `page.tsx`, `layout.tsx`, `not-found.tsx`, `opengraph-image.tsx`, `route.ts`
  handlers.
- Path alias `@/*` → `./src/*`. Never reach above `../`.
- Domain types have **no optional fields**; mappers supply total defaults.

### Server vs. client

- **Default to Server Components.** Add `"use client"` only for hooks, browser
  APIs, or event handlers.
- Server Actions carry `"use server"` and live in `action.ts` co-located with
  the page, or in `src/lib/admin/queries.ts`.
- **Data fetching happens in Server Components and Server Actions, never in
  client components.**
- `ssr: false` with `next/dynamic` is **only valid inside a Client Component**.
  In a Server Component it is a hard error. This is why `HeroSection` is
  `"use client"`.

### File naming

| Kind | Pattern |
|------|---------|
| Component | `PascalCase/index.tsx` |
| Utility, hook | `camelCase.ts` |
| Test | `Name.test.tsx` co-located beside the source |
| Route handler | `route.ts` under `src/app/api/*/` |
| Server action | `action.ts` co-located with the page |
| Migration | `supabase/migrations/NNNN_snake_name.sql`, sequential |

### Error handling

| Layer | Contract |
|-------|----------|
| Public query | `try`/`catch`, return typed fallback, **never throw** |
| Server Action | return `{ ok: boolean, error?: string }`, **never throw** |
| Route handler | `NextResponse.json({ ok, error? }, { status })` |
| `uploadFile` | **throws** — the one exception. Callers must wrap it. |

Never surface a database error string to an end user on a public page. Admin
surfaces may show `error.message`.

---

## Styling

### Token layers

1. **CSS custom properties** — `src/app/globals.css`, `@layer base`. Swap under
   `.dark`. Consumed as `bg-[rgb(var(--bg))]`, `text-[rgb(var(--fg))]`,
   `border-[rgb(var(--border))]`.

   | Variable | Light | Dark |
   |----------|-------|------|
   | `--bg` | `250 250 250` | `5 5 5` |
   | `--fg` | `5 5 5` | `245 245 245` |
   | `--muted` | `115 115 115` | `163 163 163` |
   | `--border` | `0 0 0 / 0.08` | `255 255 255 / 0.08` |
   | `--card` | `255 255 255` | `17 17 17` |
   | `--accent` | `16 185 129` | `52 211 153` |
   | `--noise-opacity` | `0.04` | `0.06` |

   > ⚠️ **`--accent` is emerald, not violet.** `.kiro/steering/design.md` claims
   > `--accent: 139 92 246` (violet). That is **wrong** for `development`. The
   > live runtime accent is emerald; the violet/fuchsia family survives only in
   > the `accent-*` and `brand-*` Tailwind tokens and the `.text-gradient*`
   > utilities. Verify in `globals.css` before trusting any colour doc.

2. **Tailwind theme** — `tailwind.config.ts`, loaded by
   `@config "../../tailwind.config.ts"` on line 2 of `globals.css`. **Tailwind 4
   does not auto-discover a JS config; that line is what makes `ink-*`,
   `accent-*`, `brand-*`, `text-fluid-*`, and the eight `animate-*` utilities
   exist.** Deleting it silently removes 232 `ink-*` usages' styling.

3. **Component and utility classes** — `globals.css`, `@layer components` /
   `@layer utilities`: `.glass`, `.glass-strong`, `.text-gradient`,
   `.text-gradient-cool`, `.text-gradient-strong`, `.text-gradient-hero`,
   `.grid-bg`, `.noise`, `.btn-sheen`, `.role-roll`, `.marquee-track`,
   `.page-enter`, `.article-prose`, `.hljs-*` (highlight.js theme), `.lenis*`.

### Rules

- **Surfaces use the CSS variables**, not raw `ink-*`, so one switch flips the
  theme.
- **Conditional classes go through `cn()`** — `twMerge(clsx(...))` from
  `src/lib/utils.ts`. Without it, Tailwind class collisions resolve by source
  order, not by intent.
- Dark mode is `class`-based via `next-themes`, `defaultTheme="light"`,
  `enableSystem`. Pair values: `bg-white dark:bg-ink-900`.
- **Every animation needs a `prefers-reduced-motion: reduce` branch** —
  `animation: none` or a plain opacity fade. `globals.css` already has two such
  blocks; add to them.
- Mobile-first. Container is centred, max-width `1400px`, padding
  `1.25rem → 1.5rem → 2rem`.

---

## Testing

- Runner: Vitest 4.1, `jsdom`, `globals: true`.
- Setup: `src/__tests__/setup.ts` mocks `next/navigation`, `next/image`,
  `next-themes`, and polyfills `scrollIntoView`.
- Tests co-located with source: `Name.test.tsx`.
- API handlers are imported directly and handed a mock `Request`.
- `fast-check` is available for property-based testing. Convention from the
  `0010` spec, worth keeping: minimum 100 runs per property, and tag each test
  `// Feature: <name>, Property N: <text>`.

```bash
npm run test           # vitest run
npm run test:watch
npm run test:coverage  # v8, text + lcov + html into ./coverage
```

> **Verified green on 2026-11-01**: 10 files, 147 tests passing. A fresh clone
> or a cross-branch install breaks it again, with the same fix — `npm install`
> then `rm -rf .next`. See
> [current-state.md](./current-state.md#how-it-was-broken-because-it-will-recur).

> **Coverage numbers are not meaningful as configured.** `vitest.config.ts`
> excludes all of `src/components/Layouts/**`, `src/lib/admin/**`,
> `src/lib/supabase/**`, every `page.tsx`, and ~20 named components — with
> several duplicate entries. Narrow the exclude list before quoting a percentage.

---

## Commands

```bash
npm run dev        # next dev — Turbopack, writes to .next/dev
npm run build      # next build — Turbopack
npm run start      # next start
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run test       # vitest run
```

**Pre-push gate:** `typecheck` → `lint` → `test` → `build`. All four.

SonarQube: `sonar-project.properties` + `.env.sonar`, run via `./sonarcube.sh`.

### ESLint posture

`eslint.config.mjs` deliberately downgrades four React-Compiler-readiness rules
to `warn`: `set-state-in-effect`, `purity`, `error-boundaries`,
`exhaustive-deps`. The config comment explains why — they flag pre-existing,
working effect patterns in animation and tool components, and forcing them to
`error` would mean risky refactors of runtime behaviour. **`npm run lint` is
expected to be green with warnings.** Promote to `error` only in a dedicated
pass.

---

## Environment variables

```
# Supabase — required for the CMS
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only, never NEXT_PUBLIC_
NEXT_PUBLIC_SUPABASE_MEDIA_BUCKET=media

# Email — required for the contact form
RESEND_API_KEY=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL=

# CAPTCHA — optional, strongly recommended
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# Notifications — documented, NOT wired on development
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Site
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
```

Degradation matrix:

| Missing | Effect |
|---------|--------|
| Supabase vars | Public site runs on seed data; admin shows `SetupNotice` |
| Resend vars | `POST /api/contact` returns 500 with a configured-yet message |
| `TURNSTILE_SECRET_KEY` | CAPTCHA skipped with a `console.warn` — **except** in production with a site key set, where it fails closed |
| `NEXT_PUBLIC_SITE_URL` | Falls back to `https://release-awesome.vercel.app` |

`NEXT_PUBLIC_*` values are **inlined into the client bundle at build time**.
Treat them as public. Everything else is server-only.
