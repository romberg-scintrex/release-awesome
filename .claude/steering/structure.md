# Structure

Where things live, and where a new thing goes. Baseline: branch `development`,
96 files under `src/`, ~13 000 lines.

## Tree

```
next-0000/
├── AGENTS.md                  → agent entry point; CLAUDE.md @-imports it
├── CLAUDE.md                  → one line: @AGENTS.md
├── next.config.ts             → CSP + security headers, image remotePatterns
├── tailwind.config.ts         → theme tokens; loaded via @config in globals.css
├── eslint.config.mjs          → flat config, 4 rules downgraded to warn
├── vitest.config.ts           → jsdom, coverage excludes
├── postcss.config.mjs         → @tailwindcss/postcss only
├── sonar-project.properties   → + .env.sonar, run by ./sonarcube.sh
│
├── .claude/                   → AUTHORITATIVE agent context
│   ├── settings/kfc-settings.json
│   ├── system-prompts/spec-workflow-starter.md
│   ├── agents/kfc/*.md        → spec-* subagent definitions
│   ├── steering/              → these documents
│   └── specs/<feature>/       → requirements.md + design.md + tasks.md
│
├── .kiro/                     → Kiro IDE tree; historical, describes branch 0010
│   ├── steering/{product,tech,design}.md
│   └── specs/{best-practice-improvements,multi-tenant-portfolio}/
│
├── supabase/
│   ├── migrations/0001-init.sql … 0004_about_stats.sql
│   └── seed.sql, seed-blog.sql
│
├── public/
│   ├── images/   → avatar.png, green.png, p2.avif, p3.webp
│   ├── videos/   → video0001–0005.mp4
│   ├── models/   → barong.glb — 78 MB, untracked, MUST NOT be committed as-is
│   └── *.svg
│
└── src/
    ├── proxy.ts                → Next 16 middleware; session refresh + /admin guard
    │
    ├── app/
    │   ├── layout.tsx          → fonts, ThemeProvider, SettingsProvider, SiteFrame, JSON-LD
    │   ├── page.tsx            → home; ISR 60
    │   ├── globals.css         → 629 lines: @config, CSS vars, components, utilities
    │   ├── about/              → ScrollyTelling + Timeline; ISR 60
    │   ├── contact/            → ContactLayout
    │   ├── blog/               → page.tsx + [slug]/page.tsx — both notFound() stubs
    │   ├── admin/
    │   │   ├── layout.tsx      → auth gate + SetupNotice + sidebar
    │   │   ├── page.tsx        → dashboard; force-dynamic
    │   │   ├── login/          → Supabase sign-in; open-redirect guarded
    │   │   ├── testimonials/   → list + inline CRUD
    │   │   ├── tools/          → page.tsx, new/, [id]/
    │   │   └── action.ts       → "use server": signOut, reorderEntities, tool CRUD
    │   ├── api/contact/route.ts
    │   ├── not-found.tsx       → path-aware 404
    │   └── opengraph-image.tsx → 1200×630 card
    │
    ├── components/
    │   ├── Elements/           → 24 atoms: Button, Field, Badge, Icons,
    │   │                         ThemeToggle, CommandPalette, CustomCursor,
    │   │                         Reveal, RevealText, Parallax, SpotlightCard,
    │   │                         GradientMesh, GradientText, NoiseTexture,
    │   │                         PageTransition, RouteProgress, ScrollSmooth,
    │   │                         ScrollTop, PortraitCard, Turnstile,
    │   │                         Providers/{ThemeProvider,SettingsProvider}
    │   ├── Fragments/          → 15 sections: MaskReveal, HeroMobile,
    │   │                         HeroOverlay, ContactForm, ContactInfo,
    │   │                         ScrollyTelling, Timeline, SectionHeading,
    │   │                         SliderDesktop, SliderMobile, MediaUpload,
    │   │                         ReorderableList, ToolForm, ToolRowActions
    │   └── Layouts/            → 13 shells: SiteFrame, Navbar, Footer,
    │                             HeroSection, MarqueeTech, Testimonials,
    │                             WritingSliderSection, Contact, AdminNavbar,
    │                             AdminTestimonials/{Save,RowWithActions},
    │                             LandingPage  ← UNTRACKED, not yet wired
    │
    ├── hooks/useContactForm.ts
    │
    ├── lib/
    │   ├── queries.ts          → 416 lines: public reads + every *Row + map*Row
    │   ├── types.ts            → domain types
    │   ├── default.ts          → 607 lines of seed data
    │   ├── utils.ts            → cn, inputClasses, jsonLdHtml, SITE, ROLES, TEXT_LINE*
    │   ├── notify-client.ts    → beacons to /api/notify — route does not exist
    │   ├── username.ts         → username policy, shared by form and server
    │   ├── rate-limit.ts       → per-IP in-memory limiter + clientIp
    │   ├── turnstile.ts        → server-side CAPTCHA verification
    │   ├── safe-redirect.ts    → open-redirect guard for ?redirect=
    │   ├── routes.ts           → ROOT_STATIC_SEGMENTS; tested against reserved_usernames
    │   ├── admin/              → queries.ts ("use server"), types.ts, upload.ts
    │   ├── supabase/           → client.ts, server.ts, middleware.ts, config.ts
    │   ├── tools/registry.ts   → 11 TOOL_COMPONENTS; renderer missing
    │   ├── fluid-simulation/   → FluidSimulation.ts, 409 lines of Three.js
    │   └── apis/{contact,notify}/  → EMPTY untracked dirs; abandoned refactor
    │
    └── __tests__/
        ├── setup.ts
        └── api/contact/route.test.ts
```

## Where does my new file go?

| I am adding… | Put it in | Also do |
|--------------|-----------|---------|
| A public page | `src/app/<route>/page.tsx` | `export const revalidate = 60`; fetch in the page, pass props down |
| An admin page | `src/app/admin/<route>/page.tsx` | `export const dynamic = "force-dynamic"`; add the link to `AdminNavbar` |
| An API endpoint | `src/app/api/<name>/route.ts` | Return `{ ok, error? }` with a real status code |
| A mutation | `src/app/admin/<route>/action.ts` or `src/lib/admin/queries.ts` | `"use server"`, `requireAdmin()` first, `revalidatePath()` after |
| A public read | `src/lib/queries.ts` | `*Row` + `map*Row()` + `cache()` + `try`/`catch` fallback |
| A domain type | `src/lib/types.ts` | No optional fields; the mapper supplies defaults |
| An admin input type | `src/lib/admin/types.ts` | Mirror the domain type, drop `id` |
| A visual primitive | `src/components/Elements/<Name>/index.tsx` | Props only; no data access |
| A composed section | `src/components/Fragments/<Name>/index.tsx` | May hold state; still no data fetching |
| A page shell | `src/components/Layouts/<Name>/index.tsx` | Receives server-fetched props |
| A hook | `src/hooks/use<Name>.ts` | Co-locate `use<Name>.test.ts` |
| A schema change | `supabase/migrations/NNNN_<name>.sql` | Idempotent: `if not exists` / `drop policy` then `create policy` |
| A seed value | `src/lib/default.ts` | Keep it in sync with the domain type |
| Static media | `public/<kind>/` | Check the size. See the asset budget below. |
| A spec | `.claude/specs/<feature>/` | `requirements.md` → `design.md` → `tasks.md`, in that order |

## Naming the thing

| Thing | Convention | Example |
|-------|-----------|---------|
| Component folder | `PascalCase` | `MediaUpload/index.tsx` |
| Component export | `PascalCase`, **named** | `export function MediaUpload` |
| Hook | `use` + `PascalCase` | `useContactForm` |
| DB row interface | domain + `Row` | `TestimonialRow` |
| Mapper | `map` + domain + `Row` | `mapTestimonialRow` |
| Public query | `get` + plural or `BySlug` | `getTools`, `getToolBySlug` |
| Admin read | `getList` + plural, `get` + `ById` | `getListTools`, `getToolById` |
| Admin write | verb + singular | `createTool`, `setToolPublished` |
| Server action result | `ActionResult` | `{ ok, error? }` |
| Migration | `NNNN_snake_case.sql` | `0005_multi_tenant.sql` |

Note the inconsistency already in the tree: `0001-init.sql` uses a hyphen while
every later migration uses an underscore. **Follow the underscore.**

## Asset budget

`public/` is served uncompressed and counts against the deployment bundle.

| Asset | Size | Verdict |
|-------|------|---------|
| `images/*` | small | fine |
| `videos/video0001–0005.mp4` | 5 files | audit before adding more |
| `models/barong.glb` | **78 MB** | ❌ must be compressed and/or moved to Supabase Storage before any commit |

Rule: **anything over ~2 MB goes to Supabase Storage, not `public/`.** The
`media` bucket already has a public-read policy and
`SUPABASE_MEDIA_BUCKET` is configured for it.

## Files that should not exist

Clean these up when you touch the surrounding code:

- `src/lib/apis/contact/`, `src/lib/apis/notify/` — empty, untracked.
- `tsconfig.json` `include` lists two `*.bak` files, one of which does not exist
  on `development`. Delete backups; do not type-check them.
- `coverage.out` at the repo root — a Go coverage artifact in a TypeScript repo.
