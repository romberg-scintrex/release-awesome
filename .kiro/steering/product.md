# Product

## What This Is

A **multi-tenant** portfolio platform + headless CMS. Each registered user gets a fully isolated public portfolio at `/:username`. The primary owner is **Gregorius Dimas A Yudhana**. The platform supports per-user content (projects, testimonials, about scenes, blog posts) with a Casbin RBAC layer controlling admin navbar visibility.

## Site Owner

- **Name**: Gregorius Dimas A Yudhana
- **Role**: Software Engineer (Golang, Next.js, PostgreSQL, Microservices, Docker, Kubernetes, AWS)
- **University**: Universitas Brawijaya
- **Location**: Jakarta, Indonesia
- **URL**: `NEXT_PUBLIC_SITE_URL` (default: `https://www.grek.co.id`)
- **Social**: GitHub `dimasyudhana`, LinkedIn `gregorius-dimas-a-yudhana-820008251`

## Public Pages

### Primary Owner Routes (backward-compatible)

| Route | Status | Description |
|-------|--------|-------------|
| `/` | ✅ Live | Primary owner's portfolio — 3D fluid-reveal hero + tech stack marquee |
| `/about` | ✅ Live | ScrollyTelling + Timeline (reads from getSettings + getAboutScenes) |
| `/contact` | ✅ Live | Contact form (email + map + socials) |
| `/blog` | 🚧 Placeholder | Returns 404 — kept for future single-owner blog |
| `/blog/[slug]` | 🚧 Placeholder | Returns 404 |

### Per-Tenant Routes (`/:username`)

| Route | Status | Description |
|-------|--------|-------------|
| `/:username` | ✅ Live | Tenant hero/home — profile + published projects |
| `/:username/about` | ✅ Live | Tenant about — ScrollyTelling + timeline |
| `/:username/contact` | ✅ Live | Tenant contact — profile socials + contact form |
| `/:username/blog` | ✅ Live | Tenant blog index — published blogs ordered by published_at desc |
| `/:username/blog/[slug]` | ✅ Live | Tenant blog post — Markdown content |

Route group `src/app/(portfolio)/[username]/` is invisible to the URL. Next.js resolves static routes (`/admin`, `/api`, `/about`, `/contact`, `/blog`) before dynamic segments — no conflicts.

## Admin Panel (`/admin`)

Authentication: Supabase email/password. Casbin RBAC controls navbar visibility (not route access — middleware still guards all routes).

| Route | Status | Description |
|-------|--------|-------------|
| `/admin` | ✅ Live | Dashboard with content stats tiles |
| `/admin/login` | ✅ Live | Sign-in form |
| `/admin/testimonials` | ✅ Live | Add / edit / delete / publish testimonials |
| `/admin/projects` | 🚧 TBD | Nav link exists, CRUD page not built |
| `/admin/blog` | 🚧 TBD | Nav link exists, CRUD page not built |
| `/admin/tools` | 🚧 TBD | Nav link exists, CRUD page not built |
| `/admin/settings` | 🚧 In progress | Reads from `profiles` table (not `site_settings`) once migration runs |

### RBAC — Casbin nav visibility
- Policies stored in `casbin_rule` table (ptype `p` = permission, `g` = role assignment)
- Admin layout calls `getVisibleNavItems(userEmail)` server-side → passes `visibleItems: NavItemKey[]` to `NavbarAdmin`
- Default when no policies exist: `["dashboard"]` only (principle of least privilege)
- `NavbarAdmin` is `"use client"` but receives `visibleItems` as a server-computed prop

### Admin setup (first-time)
1. Create a Supabase project at supabase.com
2. Run migrations `0001` through `0005_multi_tenant.sql`
3. Copy `.env.local.example` → `.env.local` and fill all keys
4. Create the admin user in Supabase → Authentication (profile is auto-created by the `handle_new_user` trigger)

## Content Model

### Entity Relationship Overview

```
+------------------------------------+
| auth.users (Supabase Auth Core)    |
+------------------------------------+
                 │ (1 : 1)
                 ▼
+------------------------------------+
| public.profiles                    |
| ────────────────────────────────── |
| id (PK) → references auth.users    |
| username (UNIQUE) [e.g. "dimas"]   |
| name, role, email, avatar, etc.    |
+------------------------------------+
                 │
                 ├── (1 : N) ──▶ public.projects      (FK: user_id)
                 ├── (1 : N) ──▶ public.testimonials  (FK: user_id)
                 ├── (1 : N) ──▶ public.about_scenes  (FK: user_id)
                 └── (1 : N) ──▶ public.blogs         (FK: user_id)
```

All content tables carry `user_id uuid not null references profiles(id) on delete cascade`. The `profiles.id` equals `auth.users.id` — there is no surrogate key; the auth identity IS the tenant identity. Anonymous reads are limited to `published = true` rows. Authenticated writes are restricted to rows where `user_id = auth.uid()` via RLS.

### Profile (multi-tenant identity — replaces site_settings singleton)
One row per registered user in the `profiles` table. `id = auth.users.id`. Fields: username (unique slug for `/:username`), name, shortName, role, university, location, email, description, social (github/linkedin/facebook/instagram), heroBackURL, heroFrontURL, heroMobileURL, aboutImageURL, cvURL. Auto-created on signup by `handle_new_user()` trigger.

### Projects
Portfolio pieces scoped to a user (`user_id → profiles.id`). Each has a slug, title, short/long description, categories (`Web | AI | Backend Services`), technologies[], year, gallery (image/video items), thumbnailURL, liveURL, githubURL, linkedinURL, gradient, sortOrder, featured, published.

### Testimonials
Short quotes from colleagues/clients. Scoped to a user (`user_id`). Quote, name, role, avatarURL, published, sortOrder.

### About Scenes
Scrollytelling scenes for `/:username/about`. Scoped to a user (`user_id`). scene_order, badge_text, title_primary, title_highlight, subtitle_code, description, text_position, bg_kinetic_text, button_*.

### Blog Posts (per-tenant `blogs` table)
Markdown content scoped to a user (`user_id`). Unique on `(user_id, slug)`. Fields: slug, title, summary, content (Markdown), coverUrl, published, publishedAt, createdAt, updatedAt. Served at `/:username/blog` and `/:username/blog/[slug]`.

### Posts (single-owner `posts` table — separate from blogs)
Legacy blog system. Slug (globally unique), title, excerpt, content, coverUrl, tags[], publishedAt, featured, published, sortOrder. Used by `src/app/blog/` (currently a 404 stub).

### Tools
Interactive or external tools (single-owner). Kind: `embedded` (renders a React component via `componentKey`) or `external` (links out). Name, tagline, description, category, icon, coverURL, gradient, featured, published, sortOrder.

### Site Settings (singleton, id=1 — deprecated, kept for rollback)
Name, shortName, role, university, location, email, url, description, social (github/linkedin/facebook/instagram), heroBackURL, heroFrontURL, heroMobileURL, aboutImageURL, cvURL, homeShowTools, homeShowBlog, stats[]. Admin reads from `profiles` once the table exists.

## Graceful Degradation

When Supabase is not configured:
- Primary owner pages (`/`, `/about`, `/contact`) work on hardcoded seed data from `src/lib/default.ts`.
- Per-tenant routes (`/:username`) return `null` from all query functions (no seed fallback — multi-tenant requires a live DB).
- The admin panel shows a `<SetupNotice>` with setup instructions instead of the CMS shell.

## Contact Form

- Fields: name, email, subject (optional), message
- Security: honeypot field (`company`) → IP rate limit (5/10min) → server validation → Cloudflare Turnstile → Resend email delivery
- Notifications: email via Resend to `CONTACT_TO_EMAIL`, optional Telegram via `TELEGRAM_BOT_TOKEN`
- No Turnstile in dev if `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is not set

## SEO & Metadata

- `metadataBase` set to `NEXT_PUBLIC_SITE_URL`
- Root layout uses `template: "%s - Gregorius Dimas A Yudhana"` for primary owner pages
- Per-tenant pages generate their own `<title>`, OpenGraph, and `alternates.canonical` from the resolved `Profile` row — never share metadata across tenants
- Title format: `{profile.name} – {profile.role}` for `/:username`, `{post.title} – {profile.name}` for blog posts
- JSON-LD structured data: `Person`, `WebSite`, `ProfilePage` schemas injected in root layout (primary owner)
- OG image generated via `src/app/opengraph-image.tsx` (1200×630 branded card)
- `robots.txt` disallows `/admin` (`robots: { index: false, follow: false }` in admin layout metadata)
- Google Search Console verification via `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- `revalidate = 60` on all public pages for ISR (primary owner + per-tenant)
- 404 for unknown username: no `<title>`, no OpenGraph, no canonical — `notFound()` is called

## Security Model

- CSP report-only in `next.config.ts` (switch key to `Content-Security-Policy` once clean)
- HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy on all routes
- Middleware (`src/proxy.ts`) guards all `/admin` routes — unauthenticated → redirect to `/admin/login`
- Casbin RBAC: controls **navbar visibility only** — middleware session check remains the route-level guard
- Casbin enforcer is created fresh per-request (never stored at module scope) — no cross-request state leakage
- Authenticated users redirected away from `/admin/login` to `/admin`
- Open redirect protection on login: only follows `redirect` params starting with `/` and not `//`
- `jsonLdHtml()` escapes `<` → `\u003c` to prevent script injection in JSON-LD blocks
- Storage RLS: authenticated users may only write to `media/{auth.uid()}/` prefix — cross-tenant write is blocked at DB level

## Analytics

- Vercel Analytics (automatic, injected in root layout via `<Analytics />`)
- Custom `notifyVisit()` and `notifyCV()` beacons send to `/api/notify` on page load and CV download clicks
- Uses `navigator.sendBeacon` with keepalive fetch fallback — failures are silently ignored
