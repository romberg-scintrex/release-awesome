# Architecture Decision Record

Append-only. To change a decision, add a new ADR that supersedes the old one and
mark the old one `Superseded by ADR-NNN`. Do not edit history.

ADR-001 … ADR-013 are **reconstructed** from the code as it stands on
`development`; they were not written at the time. They record the decision that
the code evidently embodies, with the rationale the code and its comments
support. Treat the *status* as fact and the *rationale* as best reconstruction.

| # | Decision | Status |
|---|----------|--------|
| [001](#adr-001--supabase-as-the-entire-backend) | Supabase as the entire backend | Accepted |
| [002](#adr-002--seed-data-fallback-instead-of-an-error-state) | Seed-data fallback instead of an error state | Accepted |
| [003](#adr-003--queries-never-throw) | Queries never throw | Accepted |
| [004](#adr-004--row-mappers-at-the-data-boundary) | Row mappers at the data boundary | Accepted |
| [005](#adr-005--three-tier-component-hierarchy) | Three-tier component hierarchy | Accepted |
| [006](#adr-006--server-actions-over-api-routes-for-admin-writes) | Server Actions over API routes for admin writes | Accepted |
| [007](#adr-007--requireadmin-in-addition-to-rls) | `requireAdmin()` in addition to RLS | Accepted |
| [008](#adr-008--separate-mobile-and-desktop-hero-components) | Separate mobile and desktop hero components | Accepted |
| [009](#adr-009--three-animation-libraries-coexist) | Three animation libraries coexist | Accepted, uncomfortable |
| [010](#adr-010--enforcing-csp-with-unsafe-inline-and-unsafe-eval) | Enforcing CSP with `unsafe-inline` and `unsafe-eval` | Accepted, compromised |
| [011](#adr-011--in-memory-per-ip-rate-limiting) | In-memory per-IP rate limiting | Accepted, known-weak |
| [012](#adr-012--react-compiler-lint-rules-downgraded-to-warn) | React-Compiler lint rules downgraded to `warn` | Accepted |
| [013](#adr-013--two-parallel-documentation-trees) | Two parallel documentation trees | Accepted, needs resolution |
| [014](#adr-014--claudesteering-is-the-authoritative-context-tree) | `.claude/steering/` is the authoritative context tree | Accepted |
| [015](#adr-015--the-root-is-the-platform-not-a-portfolio) | The root is the platform, not a portfolio | Accepted |
| [016](#adr-016--waitlist-with-manual-approval) | Waitlist with manual approval | Accepted, does not scale |
| [017](#adr-017--all-users-are-equal-tenants-no-platform-admin-role) | All users are equal tenants; no platform-admin role | Accepted |
| [018](#adr-018--remove-casbin) | Remove Casbin | **Implemented** 2026-11-01 |
| [019](#adr-019--the-3d-hero-belongs-to-the-platform-homepage-only) | The 3D hero belongs to the platform homepage only | Accepted |

---

## ADR-001 — Supabase as the entire backend

**Status:** Accepted
**Evidence:** `src/lib/supabase/*`, `supabase/migrations/*`, `next.config.ts` CSP

Postgres, Auth, and Storage all come from one Supabase project. No separate API
server, no ORM, no migration framework beyond numbered SQL files applied by
hand.

**Consequences.** Schema changes are hand-written SQL with `if not exists`
guards and must be idempotent, because there is no migration state table.
Authorization lives in two places — RLS in the database and `requireAdmin()` in
the app. Vendor lock-in is real but bounded: the data layer is 400 lines behind
a mapper boundary.

---

## ADR-002 — Seed data fallback instead of an error state

**Status:** Accepted
**Evidence:** `src/lib/default.ts` (607 lines), `isSupabaseConfigured`

When Supabase is unconfigured, public pages render hardcoded seed content rather
than an error or an empty state.

**Why.** The portfolio's job is to be online. A misconfigured env var or an
expired project should not take the owner's public identity offline. It also
makes local development work with zero setup.

**Consequences.** 607 lines of seed data must be kept shape-compatible with the
domain types forever. A silent fallback can mask a real outage — if the DB
breaks in production, the site serves stale seed content and looks fine. There
is no alerting on this.

> **Needs review (2026-11-01).** This ADR was written when the root served one
> person's portfolio. It no longer does: `/` is the platform homepage and needs
> no database, and tenant pages deliberately have **no** seed fallback, because
> inventing content for a tenant would be worse than a 404. That leaves
> `src/lib/default.ts` — 607 lines describing one specific portfolio — serving
> only `/about` and `/contact`, both of which task 6.4 deletes. Most of it has
> no remaining purpose. Supersede this ADR once that deletion lands.

---

## ADR-003 — Queries never throw

**Status:** Accepted
**Evidence:** every export in `src/lib/queries.ts`

Each public query is `try`/`catch` returning a typed fallback. No query
propagates an error to a caller.

**Why.** It makes ADR-002 possible, and it means no public page needs an error
boundary for data loading.

**Consequences.** Failures are invisible. There is no way to distinguish "no
rows" from "the database is unreachable" at the call site. **If you add
observability, this is the single highest-value place to put it.**

---

## ADR-004 — Row mappers at the data boundary

**Status:** Accepted
**Evidence:** `*Row` + `map*Row()` pairs throughout `src/lib/queries.ts`

Supabase returns snake_case; the app speaks camelCase. Mappers convert at the
boundary; raw rows never leave the data layer.

**Why.** Components stay decoupled from column names, so a schema rename is a
one-line change in one file. Mappers also supply total defaults, which is what
lets domain types have no optional fields.

**Consequences.** Every schema change touches three places: the migration, the
`*Row` interface, the mapper. The mappers are also the only runtime validation
that exists — and they validate shape, not content.

---

## ADR-005 — Three-tier component hierarchy

**Status:** Accepted
**Evidence:** `src/components/{Elements,Fragments,Layouts}/`

`Elements` (atoms) → `Fragments` (composed sections) → `Layouts` (page shells).
Imports flow one way. Nothing in `src/components/` fetches data.

**Why.** It makes the question "where does this component go?" answerable
without debate, and keeps data access in one layer.

**Consequences.** Some placements are arguable — `ContactForm` is a `Fragment`
while `Contact` is a `Layout`; `MediaUpload` is a `Fragment` that calls
`uploadFile`, the one data-access leak. The rule is enforced by review only;
nothing in the lint config checks it.

---

## ADR-006 — Server Actions over API routes for admin writes

**Status:** Accepted
**Evidence:** `src/app/admin/action.ts`, `src/lib/admin/queries.ts`, both `"use server"`

Admin mutations are Server Actions. The only route handler is
`POST /api/contact`, which exists because it is called by an anonymous client
with a CAPTCHA token.

**Why.** No hand-written fetch wrappers, no client-side serialization, and
`revalidatePath()` is callable in the same function that writes.

**Consequences.** Server Actions compile to public POST endpoints, which forces
ADR-007. There is no request schema, so nothing validates the payload at
runtime — see [architecture.md](./architecture.md#where-this-architecture-is-under-strain), item 5.

---

## ADR-007 — `requireAdmin()` in addition to RLS

**Status:** Accepted
**Evidence:** `src/lib/admin/queries.ts:29`, and its own comment

Every admin write calls `requireAdmin()` first, which uses
`supabase.auth.getUser()` — **never** `getSession()`.

**Why.** Stated in the code: Server Actions are public POST routes, so RLS alone
is not accepted as the only control. `getUser()` validates the JWT against the
auth server; `getSession()` reads a cookie and is spoofable.

**Consequences.** One extra auth round-trip per mutation. Worth it.

---

## ADR-008 — Separate mobile and desktop hero components

**Status:** Accepted
**Evidence:** `src/components/Layouts/HeroSection/index.tsx`

`MobileHero` (`md:hidden`) and `MaskRevealHero` (`hidden md:block`) are distinct
components behind CSS breakpoints, not one responsive component.

**Why.** WebGL fluid simulation on a phone is a battery and thermal problem, and
the editorial mobile layout is genuinely a different design, not a reflow.

**Consequences.** Two hero implementations to maintain, and visual changes must
be made twice. `MaskRevealHero` is `next/dynamic` with `ssr: false`, which
requires `HeroSection` to be a Client Component — `ssr: false` is a hard error in
a Server Component in Next.js 16.

---

## ADR-009 — Three animation libraries coexist

**Status:** Accepted, uncomfortable
**Evidence:** `framer-motion`, `gsap` + `@gsap/react`, `lenis`, plus CSS keyframes

Framer Motion for React-state-driven transitions, GSAP for timeline
choreography, Lenis for smooth scroll, raw CSS for marquees and loops.

**Why.** Each was reached for where it is strongest. GSAP arrived with the
in-flight `LandingPage` work (`useGSAP` with a `scope` ref).

**Consequences.** Significant bundle weight and four different reduced-motion
mechanisms to keep consistent: `MotionConfig reducedMotion="user"` in
`SiteFrame`, GSAP timelines, Lenis config, and `@media (prefers-reduced-motion)`
blocks in `globals.css`. **Before adding a fourth system, remove one.**

---

## ADR-010 — Enforcing CSP with `unsafe-inline` and `unsafe-eval`

**Status:** Accepted, compromised
**Evidence:** `next.config.ts`, and task 9 of `.kiro/specs/best-practice-improvements`

CSP was flipped from `Report-Only` to enforcing. `script-src` retains both
`'unsafe-inline'` and `'unsafe-eval'`.

**Why.** The comment in `next.config.ts` says React dev-mode and the Turnstile
script need `unsafe-eval`. `unsafe-inline` is needed by Next.js's inline
bootstrap scripts and the JSON-LD blocks.

**Consequences.** The CSP provides origin restriction but **not** meaningful XSS
protection, since inline script is permitted. This is why `jsonLdHtml()` and
`escapeHtml()` are load-bearing rather than belt-and-braces. The correct fix is
nonce-based CSP via the proxy; that is unimplemented.

---

## ADR-011 — In-memory per-IP rate limiting

**Status:** Accepted, known-weak
**Evidence:** `src/app/api/contact/route.ts`, module-level `hits` Map

5 submissions per IP per 10 minutes, in a module-level `Map`.

**Why.** Zero infrastructure. The code's own comment is explicit that on
serverless this is per-instance and resets on cold start, so it is "a light burst
guard layered under Turnstile, not a hard guarantee."

**Consequences.** Trivially bypassed by distributing requests. Turnstile is the
actual control. Do not treat the rate limit as a security boundary. Upgrading
means Upstash/Redis or Vercel's own rate limiting.

---

## ADR-012 — React-Compiler lint rules downgraded to `warn`

**Status:** Accepted
**Evidence:** `eslint.config.mjs`, with a rationale comment

`react-hooks/set-state-in-effect`, `purity`, `error-boundaries`, and
`exhaustive-deps` are `warn`, not `error`.

**Why.** Quoting the config: they flag pre-existing, working effect patterns in
animation and tool components. Keeping them as warnings leaves `npm run lint`
green and the hints visible "without forcing risky refactors of runtime
behavior."

**Consequences.** 8 warnings are the expected steady state, so a *new* warning
is easy to miss. The codebase is not React-Compiler-ready; `reactCompiler: true`
would need these resolved first.

---

## ADR-013 — Two parallel documentation trees

**Status:** Accepted, needs resolution
**Evidence:** `.kiro/` and `.claude/`

`.kiro/` is written by the Kiro IDE; `.claude/` by Claude Code via
`.claude/settings/kfc-settings.json`.

**Consequences.** Duplication and drift. `.kiro/steering/*.md` on branch `0010`
describes the multi-tenant design as current fact, which is false on
`development` — and its `design.md` states `--accent: 139 92 246` (violet) when
`globals.css` has emerald. A reader trusting the wrong tree writes wrong code.
Superseded in part by ADR-014; the trees should eventually be merged into one.

---

## ADR-014 — `.claude/steering/` is the authoritative context tree

**Status:** Accepted
**Date:** 2026-11-01
**Supersedes, in part:** ADR-013

`.claude/steering/` is the single source of truth for agents and developers
working on `development`. `.kiro/` is retained as a historical record of the
`0010` multi-tenant design and the earlier best-practice work.

**Why.** Two trees that both claim authority is worse than one tree plus an
archive. `.claude/` is where the tooling in
`.claude/settings/kfc-settings.json` already points.

**Consequences.** `.kiro/steering/*.md` must not be cited as a description of
`development`. Steering docs are now part of the definition of done: behaviour
changes update them in the same commit. Doc rot becomes a review item.

**Open question this does not settle.** Whether `feature/release-awesome/0010`
gets merged. Every spec in `.claude/specs/` declares its own dependency on that
merge; resolve it before starting a spec that needs `profiles` or `user_id`.

---

## ADR-015 — The root is the platform, not a portfolio

**Status:** Accepted
**Date:** 2026-11-01

`next-0000` is a multi-tenant platform. The root surface serves the **product**:
a homepage with the value proposition and a call to register or sign in. Every
portfolio lives under `/:username`.

Consequently `/about`, `/contact`, `/blog`, and `/blog/[slug]` are **removed
from the root**. They currently serve the primary owner; in the target product
that content is reachable at `/dimasyudhana/about` and so on, like any other
tenant's.

**Why remove rather than repurpose them as platform pages.** Every static root
path is a username that can never be registered, and a path a signing-up user
can be silently locked out of ([G14](./current-state.md#g1--apinotify-does-not-exist)).
Keeping the root surface minimal keeps the reserved list short and the collision
surface small. A platform that genuinely needs an about page can add one later
and reserve the word deliberately.

**Rejected: keep the root as the owner's portfolio showcase.** It makes the
owner structurally special, which contradicts
[ADR-017](#adr-017--all-users-are-equal-tenants-no-platform-admin-role), and it
gives the product no homepage of its own.

**Consequences.** The root layout's title template, `Person` JSON-LD, and
`keywords` array all currently describe one person and must change. `/blog` and
`/blog/[slug]` are `notFound()` stubs today, so deleting them costs nothing.
`src/lib/default.ts` — 607 lines of one person's seed data — loses most of its
purpose; its future is an open question.

---

## ADR-016 — Waitlist with manual approval

**Status:** Accepted, does not scale
**Date:** 2026-11-01

Registration is open to anyone, but a portfolio does not go live until the
account is approved. State lives in a new `profiles.status` column —
`pending` / `approved` / `rejected`. **Approval is performed by editing that
column in the Supabase dashboard.** There is no in-app approval panel.

**Why.** It is the smallest control that prevents username squatting and
spam portfolios on a public-signup product, and it costs no UI. The alternative
controls each cost more: email verification alone does not stop squatting, and
invite codes require an invite table plus generation UI.

**Why no approval panel.** A panel needs a privileged role, which
[ADR-017](#adr-017--all-users-are-equal-tenants-no-platform-admin-role)
deliberately declines to introduce. Editing one column in the Supabase dashboard
is a worse experience and a much smaller amount of code and attack surface.

**Consequences, stated plainly.** This does not scale. Every registration needs
a human, in a tool outside the product, with no notification. If signups ever
arrive faster than they can be read, the queue silently becomes the product's
bottleneck. Revisit at that point, not before — and `profiles.status` is the
seam that makes revisiting cheap.

A `pending` tenant can still sign in and use the whole CMS; only publication is
gated. That is intentional — it gives the approver something real to judge.

---

## ADR-017 — All users are equal tenants; no platform-admin role

**Status:** Accepted
**Date:** 2026-11-01

There is one kind of user: a tenant. No platform-administrator role, no
elevated permissions, no moderation UI. Operational work — approving signups,
removing abusive content — is done directly in the Supabase dashboard.

**Why.** A privileged in-app role is a permanent security boundary to design,
test, and defend, for a product with one operator who already has full database
access. The dashboard is strictly more capable than any panel that would be
built, and it needs no code.

**Rejected: a `platform_admin` role with a moderation panel.** Correct at scale,
premature now. It would also have to be the first consumer of a role system that
[ADR-018](#adr-018--remove-casbin) is removing.

**Consequences.** Moderation is manual and outside the product. There is no
audit trail of operator actions beyond Postgres logs. If the platform ever needs
a second operator, or delegated moderation, this ADR is the one to supersede —
and doing so means reintroducing a role system.

---

## ADR-018 — Remove Casbin

**Status:** Implemented 2026-11-01
**Supersedes, in part:** the RBAC design in `.kiro/specs/multi-tenant-portfolio/`
**Date:** 2026-11-01

Delete `src/lib/casbin/enforcer.ts`, `src/lib/casbin/model.conf`, the
`casbin_rule` table and its seed from `supabase/migrations/0005_multi_tenant.sql`,
and the `casbin` dependency. `AdminNavbar` renders a fixed list again; access
control is RLS plus `requireAdmin()`.

**Why.** Casbin controls **navbar visibility only** — the `0010` design says so
explicitly, and route access is guarded by `src/proxy.ts` regardless. With all
users equal tenants ([ADR-017](#adr-017--all-users-are-equal-tenants-no-platform-admin-role)),
every tenant should see every nav item, scoped by RLS to their own rows. A
policy engine that computes the same answer for every subject is pure cost.

It is also actively broken for this product. Policies are seeded per-email;
`getVisibleNavItems()` falls back to `["dashboard"]` when nothing matches. A
newly registered tenant therefore **cannot reach any page that edits their own
portfolio** ([G15](./current-state.md#g1--apinotify-does-not-exist)).
The fallback is right; the model is the wrong shape.

**Rejected: seed a `tenant` role and add a `g` row per signup.** It makes
`handle_new_user` responsible for authorization bookkeeping, adds a failure mode
at the moment of registration, and still computes one answer for everyone.

**Rejected: keep it for the future.** Unused authorization code rots and gives
false assurance. The `0010` enforcer already reads a service-role key and
constructs an enforcer per request — real complexity for no present benefit.

**Consequences.** ~140 lines and one dependency removed. If per-user permissions
are ever needed — delegated editors on a tenant, for instance — this must be
rebuilt. The `0010` branch must be amended before or during its merge, which is
the main cost: it is a documented, completed part of that spec.

---

## ADR-019 — The 3D hero belongs to the platform homepage only

**Status:** Accepted
**Date:** 2026-11-01

The React Three Fiber scene and the Barong model render on `/` only. Tenant
portfolios get a lighter, customisable hero driven by their own `profiles` data.

**Why.** The asset is the constraint. Even compressed to the 8 MB budget, a
model loaded on every tenant portfolio multiplies that cost across the whole
platform and makes every tenant's Core Web Vitals hostage to one shared asset
they did not choose. On the homepage it is loaded once, for the one page whose
job is to impress.

It is also the wrong content. The Barong model is a specific cultural artefact;
it is the platform's branding, not a neutral frame for anyone's portfolio.

**Rejected: shared scene usable by both.** It sounds like reuse but means every
tenant page carries the WebGL path, plus a per-tenant toggle, plus a model
upload pipeline, plus a per-tenant performance budget nobody owns.

**Consequences.** One WebGL context on the platform homepage, none on tenant
pages. Tenant heroes need their own design — which is also an opportunity, since
`profiles` already carries `hero_back_url`, `hero_front_url`, and
`hero_mobile_url`. The existing `MaskReveal` fluid hero, slated for deletion in
[`specs/landing-3d-experience`](../specs/landing-3d-experience/design.md), is a
candidate to repurpose for tenant portfolios instead — reconsider that deletion
in light of this ADR.
