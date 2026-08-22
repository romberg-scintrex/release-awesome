# Tech

## Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript 5 (strict mode) — never use `any` without justification
- **Styling**: Tailwind CSS 4 via `@tailwindcss/postcss`, config in `tailwind.config.ts`
- **Backend/DB**: Supabase (PostgreSQL + Auth + Storage) via `@supabase/ssr`
- **RBAC**: Casbin.js (`casbin`) — server-side policy enforcement loaded from `casbin_rule` Postgres table
- **Email**: Resend (`RESEND_API_KEY`)
- **CAPTCHA**: Cloudflare Turnstile (`NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`)
- **3D/Animation**: Three.js (fluid sim WebGL hero), Framer Motion, Lenis (smooth scroll)
- **Testing**: Vitest 4.1 + @testing-library/react + jsdom + fast-check (property-based testing)
- **Linting**: ESLint 9 flat config (next/core-web-vitals + typescript)
- **Deployment**: Vercel (auto-deploy on push to main)
- **Analytics**: Vercel Analytics + custom `sendBeacon` to `/api/notify`

## Project Structure

```
src/
├── app/                    → Next.js App Router pages & API routes
│   ├── layout.tsx          → Root layout (ThemeProvider, SettingsProvider, SiteFrame, JSON-LD)
│   ├── page.tsx            → Home — serves primary owner's portfolio (backward compat)
│   ├── about/              → Primary owner's about page (ScrollyTelling + Timeline)
│   ├── contact/            → Primary owner's contact page
│   ├── blog/               → Placeholder (notFound) — kept for future single-owner blog
│   ├── (portfolio)/        → Route group: invisible to URL, no conflict with static routes
│   │   └── [username]/     → Per-tenant public portfolio
│   │       ├── page.tsx              → /:username home (hero + projects)
│   │       ├── about/page.tsx        → /:username/about
│   │       ├── contact/page.tsx      → /:username/contact
│   │       └── blog/
│   │           ├── page.tsx          → /:username/blog (index)
│   │           └── [slug]/page.tsx   → /:username/blog/[slug]
│   ├── admin/              → Admin CMS (auth-gated, Casbin RBAC-controlled navbar)
│   │   ├── layout.tsx      → Admin shell — evaluates Casbin policies, passes visibleItems
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
│   ├── queries.ts          → Public reads for primary owner (site_settings path) + row mappers
│   ├── queries-by-user.ts  → Username-scoped public reads (profiles path) + Profile/BlogPost mappers
│   ├── types.ts            → Domain types: Project, Post, Tool, Testimonial, SiteSettings, Profile, BlogPost, SlideItem
│   ├── default.ts          → Seed fallback data (projects, testimonials, stats, skills, timeline)
│   ├── utils.ts            → cn(), jsonLdHtml(), SITE, ROLES, TEXT_LINE1/LINE2
│   ├── notify-client.ts    → Client beacon (sendBeacon fallback to keepalive fetch)
│   ├── casbin/             → RBAC: model.conf + enforcer.ts (createEnforcerForRequest, getVisibleNavItems)
│   ├── admin/              → Admin CRUD queries, input types, file upload (userId-scoped path)
│   ├── supabase/           → client.ts, server.ts, config.ts, middleware.ts
│   └── fluid-simulation/   → Three.js FluidSimulation class
└── proxy.ts                → Middleware entry (session refresh + /admin auth guard)
```

## Data Layer

### Supabase client modes

| Client | File | Usage |
|--------|------|-------|
| Anon (no cookies) | `src/lib/queries.ts` (inline) | Primary owner public reads — cacheable, no auth |
| Anon (no cookies) | `src/lib/queries-by-user.ts` (inline) | Per-tenant public reads scoped by username |
| Server (cookie) | `src/lib/supabase/server.ts` | Server components, actions, routes |
| Browser | `src/lib/supabase/client.ts` | Admin client components (login, upload) |
| Middleware | `src/lib/supabase/middleware.ts` | Session refresh on every request |

### Row mapping convention
All Supabase rows arrive as `snake_case`. Every table has a `*Row` interface and a `map*Row()` function that converts to the camelCase domain type. Never pass raw DB rows to components.

- Primary owner queries: mappers live in `src/lib/queries.ts`
- Username-scoped queries: `ProfileRow`, `BlogPostRow` mappers live in `src/lib/queries-by-user.ts`

### Query pattern
```typescript
export const getProfileByUsername = cache(async (username: string): Promise<Profile | null> => {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await anon().from("profiles").select("*").eq("username", username).maybeSingle();
    if (error || !data) return null;
    return mapProfileRow(data);
  } catch { return null; }
});
```
- Always wrapped in `React.cache()` for per-render deduplication.
- Never throws — returns safe fallback (`null` or `[]`).
- Returns `null`/`[]` immediately when Supabase is not configured (no seed fallback for multi-tenant).

### Casbin RBAC pattern
```typescript
// ALWAYS create fresh per request — NEVER store at module scope
export async function createEnforcerForRequest(): Promise<Enforcer | null> {
  try {
    return await newEnforcer(modelPath, pgAdapter);
  } catch { return null; }
}

export async function getVisibleNavItems(userEmail: string): Promise<NavItemKey[]> {
  try {
    const enforcer = await createEnforcerForRequest();
    if (!enforcer) return ["dashboard"];
    // ... enforce per nav item
    return visible.length > 0 ? visible : ["dashboard"];
  } catch { return ["dashboard"]; }
}
```
- Enforcer is instantiated once per request inside the Server Component layout.
- On any error (DB unreachable, empty policy set), falls back to `["dashboard"]` — never escalates access.

### Supabase tables

| Table | Key columns | Notes |
|-------|-------------|-------|
| `profiles` | id (= auth.users.id), username (unique), name, social_*, hero_*_url, cv_url | Replaces site_settings singleton for multi-tenant |
| `projects` | published, sort_order, featured, gallery (JSONB), categories[], user_id | user_id → profiles.id |
| `testimonials` | published, sort_order, user_id | user_id → profiles.id |
| `about_scenes` | scene_order, published, user_id | user_id → profiles.id |
| `blogs` | published, published_at, slug, user_id, unique(user_id, slug) | New table for per-tenant blog posts |
| `site_settings` | id=1 singleton, stats (JSONB), hero_*_url, social_* | Kept for backward compat, deprecated |
| `posts` | published, sort_order, featured, published_at | Single-owner blog, separate from blogs |
| `tools` | published, sort_order, kind (embedded/external), component_key, external_url | Single-owner |
| `casbin_rule` | id, ptype, v0–v5 | RBAC policies: p = (sub, obj, act), g = (user, role) |

RLS:
- `profiles`: anon can read any row (public portfolios). Auth can read/write own row (`auth.uid() = id`).
- `projects`/`testimonials`/`about_scenes`/`blogs`: anon reads `published = true`. Auth reads/writes own rows (`user_id = (select id from profiles where id = auth.uid())`).
- `storage.objects` (media bucket): anon reads all. Auth writes only under `{auth.uid()}/` prefix.

### Storage
- Upload path: `{userId}/{uuid}.{ext}` within the `media` bucket.
- `uploadFile(file: File, userId: string)` in `src/lib/admin/upload.ts` — second param is `userId`, not `folder`.

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
- **Property-based tests**: `fast-check` — use `fc.assert(fc.property(...))` or `fc.asyncProperty`; minimum 100 runs per property; tag each test with `// Feature: <name>, Property N: <text>`
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
