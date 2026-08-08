# Tech

## Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript 5 (strict mode) — never use `any` without justification
- **Styling**: Tailwind CSS 4 via `@tailwindcss/postcss`, config in `tailwind.config.ts`
- **Backend/DB**: Supabase (PostgreSQL + Auth + Storage) via `@supabase/ssr`
- **Email**: Resend (`RESEND_API_KEY`)
- **CAPTCHA**: Cloudflare Turnstile (`NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`)
- **3D/Animation**: Three.js (fluid sim WebGL hero), Framer Motion, Lenis (smooth scroll)
- **Testing**: Vitest 4.1 + @testing-library/react + jsdom
- **Linting**: ESLint 9 flat config (next/core-web-vitals + typescript)
- **Deployment**: Vercel (auto-deploy on push to main)
- **Analytics**: Vercel Analytics + custom `sendBeacon` to `/api/notify`

## Project Structure

```
src/
├── app/                    → Next.js App Router pages & API routes
│   ├── layout.tsx          → Root layout (ThemeProvider, SettingsProvider, SiteFrame, JSON-LD)
│   ├── page.tsx            → Home (hero + marquee)
│   ├── contact/            → Contact page
│   ├── about/              → Placeholder (notFound)
│   ├── blog/               → Placeholder (notFound)
│   ├── admin/              → Admin CMS (auth-gated)
│   │   ├── layout.tsx      → Admin shell (3 states: not configured / not authed / authed)
│   │   ├── page.tsx        → Dashboard stats
│   │   ├── login/          → Supabase email/password login
│   │   ├── testimonials/   → Testimonials CRUD
│   │   └── action.ts       → signOut server action
│   └── api/contact/        → POST handler (honeypot → rate limit → Turnstile → Resend)
├── components/
│   ├── Elements/           → Atoms/molecules (Button, Field, CommandPalette, ThemeToggle…)
│   ├── Fragments/          → Composed sections (ContactForm, HeroMobile, MaskReveal…)
│   └── Layouts/            → Page-level wrappers (Navbar, Footer, SiteFrame, AdminNavbar…)
├── hooks/                  → Custom hooks (useContactForm)
├── lib/
│   ├── queries.ts          → Public Supabase reads + row mappers + React.cache()
│   ├── types.ts            → Domain types: Project, Post, Tool, Testimonial, SiteSettings, SlideItem
│   ├── default.ts          → Seed fallback data (projects, testimonials, stats, skills, timeline)
│   ├── utils.ts            → cn(), jsonLdHtml(), SITE, ROLES, TEXT_LINE1/LINE2
│   ├── notify-client.ts    → Client beacon (sendBeacon fallback to keepalive fetch)
│   ├── admin/              → Admin CRUD queries, input types, file upload
│   ├── supabase/           → client.ts, server.ts, config.ts, middleware.ts
│   └── fluid-simulation/   → Three.js FluidSimulation class
└── proxy.ts                → Middleware entry (session refresh + /admin auth guard)
```

## Data Layer

### Two Supabase client modes

| Client | File | Usage |
|--------|------|-------|
| Anon (no cookies) | `src/lib/queries.ts` (inline) | Public reads — cacheable, no auth |
| Server (cookie) | `src/lib/supabase/server.ts` | Server components, actions, routes |
| Browser | `src/lib/supabase/client.ts` | Admin client components (login, upload) |
| Middleware | `src/lib/supabase/middleware.ts` | Session refresh on every request |

### Row mapping convention
All Supabase rows arrive as `snake_case`. Every table has a `*Row` interface and a `map*Row()` function in `queries.ts` that converts to the camelCase domain type. Never pass raw DB rows to components.

### Query pattern
```typescript
export const getProjects = cache(async (): Promise<Project[]> => {
  if (!isSupabaseConfigured) return seedProjects.filter(p => p.published);
  try {
    const { data, error } = await anon().from("projects").select("*").eq("published", true);
    if (error || !data) return fallback;
    return data.map(mapProjectRow);
  } catch { return fallback; }
});
```
- Always wrapped in `React.cache()` for per-render deduplication.
- Never throws — returns safe fallback.
- Falls back to `src/lib/default.ts` seed data when Supabase isn't configured.

### Supabase tables

| Table | Key columns |
|-------|-------------|
| `projects` | published, sort_order, featured, gallery (JSONB), categories[], technologies[] |
| `testimonials` | published, sort_order |
| `site_settings` | id=1 singleton, stats (JSONB), hero_*_url, social_* |
| `posts` | published, sort_order, featured, published_at |
| `tools` | published, sort_order, kind (embedded/external), component_key, external_url |

RLS: anon users only see `published = true` rows. Authenticated users have full CRUD.

## Coding Conventions

### TypeScript
- Strict mode on. Prefer `interface` for shapes, `type` for unions/intersections.
- Named exports everywhere. Default exports only for Next.js page/layout files.
- Path alias `@/*` → `./src/*`. Never use relative paths that go above `../`.

### Server vs Client
- Default to Server Components. Add `"use client"` only for hooks, browser APIs, or event handlers.
- Server Actions: `"use server"` directive, live in `action.ts` co-located with the page.
- Data fetching always in Server Components or server actions, not client components.

### File naming
- Components: `PascalCase/index.tsx` folder structure.
- Utilities/hooks: `camelCase.ts`.
- Tests: `ComponentName.test.tsx` co-located in the same folder.
- API routes: `route.ts` inside `app/api/*/`.

### Error handling
- API routes return `{ ok: boolean, error?: string }` with proper HTTP status codes.
- Public queries always use try/catch with fallback — never surface DB errors to users.

## Testing

- **Runner**: Vitest 4.1, jsdom, globals enabled
- **Setup file**: `src/__tests__/setup.ts` — mocks next/navigation, next/image, next-themes; polyfills scrollIntoView
- **Commands**: `npm run test` | `npm run test:watch` | `npm run test:coverage`
- **Pattern**: `describe`/`it`, render with @testing-library/react, assert with jest-dom
- **API tests**: import handler directly, pass a mock `Request` object
- Tests are co-located with source files

## Build & Deploy

```bash
npm run dev           # next dev
npm run build         # next build
npm run start         # next start
npm run lint          # eslint
npm run typecheck     # tsc --noEmit
npm run test          # vitest run
```

Pre-push: `typecheck` → `lint` → `test` → `build`

- Node.js >= 20 required.
- Public pages: `export const revalidate = 60` (ISR).
- Admin pages: `export const dynamic = "force-dynamic"`.
- Remote image domains: `*.supabase.co`, `picsum.photos`, `images.unsplash.com`, `cdn.simpleicons.org`, `upload.wikimedia.org`.
- SonarQube config: `sonar-project.properties` + `.env.sonar`, run via `sonarcube.sh`.

## Environment Variables

```
# Supabase (required for CMS)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_MEDIA_BUCKET=media

# Email (required for contact form)
RESEND_API_KEY=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL=

# CAPTCHA (optional but recommended)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# Notifications (optional)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Site
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
```

- `NEXT_PUBLIC_*` vars are browser-safe. Server-only secrets must NEVER be prefixed with `NEXT_PUBLIC_`.
- Without Supabase vars: site uses seed data, admin shows setup notice.
- Without Resend vars: contact API returns 500.
- Without Turnstile vars: CAPTCHA check is skipped (dev mode).
