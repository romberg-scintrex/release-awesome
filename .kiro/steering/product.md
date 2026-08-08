# Product

## What This Is

A personal portfolio site + headless CMS for **Gregorius Dimas A Yudhana**, a Software Engineer (Golang / Next.js) based in Jakarta, Indonesia. The public site showcases projects, a blog, and a contact form. The admin panel manages all content via Supabase.

## Site Owner

- **Name**: Gregorius Dimas A Yudhana
- **Role**: Software Engineer (Golang, Next.js, PostgreSQL, Microservices, Docker, Kubernetes, AWS)
- **University**: Universitas Brawijaya
- **Location**: Jakarta, Indonesia
- **URL**: `NEXT_PUBLIC_SITE_URL` (default: `https://www.grek.co.id`)
- **Social**: GitHub `dimasyudhana`, LinkedIn `gregorius-dimas-a-yudhana-820008251`

## Public Pages

| Route | Status | Description |
|-------|--------|-------------|
| `/` | ✅ Live | 3D fluid-reveal hero + tech stack marquee |
| `/contact` | ✅ Live | Contact form (email + map + socials) |
| `/about` | 🚧 Placeholder | Returns 404 — not built yet |
| `/blog` | 🚧 Placeholder | Returns 404 — not built yet |
| `/blog/[slug]` | 🚧 Placeholder | Returns 404 — not built yet |

## Admin Panel (`/admin`)

Authentication: Supabase email/password. Requires env vars + DB migration to activate.

| Route | Status | Description |
|-------|--------|-------------|
| `/admin` | ✅ Live | Dashboard with content stats tiles |
| `/admin/login` | ✅ Live | Sign-in form |
| `/admin/testimonials` | ✅ Live | Add / edit / delete / publish testimonials |
| `/admin/projects` | 🚧 TBD | Nav link exists, CRUD page not built |
| `/admin/blog` | 🚧 TBD | Nav link exists, CRUD page not built |
| `/admin/tools` | 🚧 TBD | Nav link exists, CRUD page not built |
| `/admin/settings` | 🚧 TBD | Nav link exists, CRUD page not built |

### Admin setup (first-time)
1. Create a Supabase project at supabase.com
2. Run `supabase/migrations/0001_init.sql` then `supabase/seed.sql`
3. Copy `.env.local.example` → `.env.local` and fill all keys
4. Create the admin user in Supabase → Authentication

## Content Model

### Projects
Portfolio pieces. Each has a slug, title, short/long description, categories (`Web | AI | Backend Services`), technologies[], year, gallery (image/video items), thumbnailURL, liveURL, githubURL, linkedinURL, gradient, sortOrder, featured, published.

### Testimonials
Short quotes from colleagues/clients. Quote, name, role, avatarURL, published, sortOrder.

### Blog Posts
Markdown content. Slug, title, excerpt, content, coverUrl, tags[], publishedAt, featured, published, sortOrder.

### Tools
Interactive or external tools. Kind: `embedded` (renders a React component via `componentKey`) or `external` (links out). Name, tagline, description, category, icon, coverURL, gradient, featured, published, sortOrder.

### Site Settings (singleton, id=1)
Name, shortName, role, university, location, email, url, description, social (github/linkedin/facebook/instagram), heroBackURL, heroFrontURL, heroMobileURL, aboutImageURL, cvURL, homeShowTools, homeShowBlog, stats[].

## Graceful Degradation

When Supabase is not configured, the site works entirely on hardcoded seed data from `src/lib/default.ts` — the same data that is mirrored in `supabase/seed.sql`. The admin panel shows a `<SetupNotice>` with setup instructions instead of the CMS shell.

## Contact Form

- Fields: name, email, subject (optional), message
- Security: honeypot field (`company`) → IP rate limit (5/10min) → server validation → Cloudflare Turnstile → Resend email delivery
- Notifications: email via Resend to `CONTACT_TO_EMAIL`, optional Telegram via `TELEGRAM_BOT_TOKEN`
- No Turnstile in dev if `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is not set

## SEO & Metadata

- `metadataBase` set to `NEXT_PUBLIC_SITE_URL`
- `template: "%s - Gregorius Dimas A Yudhana"` for page titles
- OpenGraph + Twitter card metadata on each page
- JSON-LD structured data: `Person`, `WebSite`, `ProfilePage` schemas injected in root layout
- OG image generated via `src/app/opengraph-image.tsx` (1200×630 branded card)
- `robots.txt` disallows `/admin` (`robots: { index: false, follow: false }` in admin layout metadata)
- Google Search Console verification via `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- `revalidate = 60` on public pages for ISR

## Security Model

- CSP report-only in `next.config.ts` (switch key to `Content-Security-Policy` once clean)
- HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy on all routes
- Middleware (`src/proxy.ts`) guards all `/admin` routes — unauthenticated → redirect to `/admin/login`
- Authenticated users redirected away from `/admin/login` to `/admin`
- Open redirect protection on login: only follows `redirect` params starting with `/` and not `//`
- `jsonLdHtml()` escapes `<` → `\u003c` to prevent script injection in JSON-LD blocks

## Analytics

- Vercel Analytics (automatic, injected in root layout via `<Analytics />`)
- Custom `notifyVisit()` and `notifyCV()` beacons send to `/api/notify` on page load and CV download clicks
- Uses `navigator.sendBeacon` with keepalive fetch fallback — failures are silently ignored
