# Requirements — 3D Landing Experience

> ## ⚠️ Needs re-baseline before implementation
>
> This spec was written when `/` was understood to be the owner's portfolio.
> The product is a **multi-tenant platform**: the root is the platform's own
> homepage and portfolios live at `/:username`. See
> [product.md](../../steering/product.md).
>
> Per [ADR-019](../../steering/decisions.md#adr-019--the-3d-hero-belongs-to-the-platform-homepage-only),
> the 3D hero belongs to the **platform homepage only** — not to tenant
> portfolios.
>
> **What changes:** Requirement 5 (relationship to the existing hero) and
> Requirement 6 (content wiring) need rewriting; design decisions D1, D2, and
> D6 need revisiting. In particular, Requirement 5.7 is now wrong — the root
> emits `WebSite` structured data, not `ProfilePage` — and `MaskReveal` is a
> candidate to *repurpose* as the tenant hero rather than delete.
>
> **What survives unchanged:** the asset pipeline (Requirement 2, design D3 and
> D4), the performance budget (Requirement 4), the capability gate (D5), and the
> accessibility rules (Requirement 7). That is the valuable core.
>
> Prerequisite: [`platform-homepage-signup`](../platform-homepage-signup/requirements.md)
> task 6, which creates the homepage this hero lives on.
> Details: [specs/README.md](../README.md#landing-3d-experience).


## Introduction

An interactive 3D landing hero was being built when the work was interrupted by
a branch switch. What survives is `src/components/Layouts/LandingPage/index.tsx`
(untracked, GSAP-animated, no 3D yet) and `public/models/barong.glb` (untracked,
**78 MB**). The integration into `src/app/page.tsx` and the
`@react-three/fiber` / `@react-three/drei` dependencies were reverted.

This spec reconstructs that work deliberately: it re-establishes the dependency
and route wiring, adds a React Three Fiber scene rendering the Barong model, and
— the part that was never solved — makes the asset small enough to ship and the
scene cheap enough to run on a mid-range phone.

## Baseline assumptions

- Branch `development`, HEAD `efa8456`.
- **Does not depend on the `0010` merge.** Content comes from props, not from
  `profiles`.
- The build gate must be green before task 1. See
  [current-state.md](../../steering/current-state.md#build-health).

## Glossary

- **LandingPage**: The client component at
  `src/components/Layouts/LandingPage/index.tsx`. Currently renders a GSAP-animated
  hero: badge, heading, description, two CTAs, skill pills, three stat cards.
- **TenantData**: The props interface `LandingPage` already exports — `name`,
  `subdomain`, `tagline`, `description`, `primaryCtaText`, `primaryCtaLink`,
  `secondaryCtaText`, `secondaryCtaLink`, `skills[]`, `stats[]`. Named for the
  multi-tenant future; sourced from `SiteSettings` today.
- **Scene**: The React Three Fiber `<Canvas>` subtree rendering the 3D model.
- **Model_Asset**: The GLB file rendered by the Scene.
- **Source_Model**: `public/models/barong.glb` as it exists today — 78 MB,
  uncompressed, untracked.
- **Optimised_Model**: The compressed derivative that actually ships.
- **Asset_Origin**: Where the Optimised_Model is served from — `public/` or
  Supabase Storage.
- **Performance_Budget**: The numeric limits in Requirement 4 that the Scene
  must satisfy.
- **Fallback_Visual**: What renders in place of the Scene when WebGL is
  unavailable, the device is low-capability, or the viewer has requested reduced
  motion.
- **Existing_Hero**: `HeroSection` → `MaskReveal` → `FluidSimulation`, the
  current Three.js WebGL hero on `/`.
- **Legacy_Home**: The current `src/app/page.tsx` composition — `HeroSection`,
  `MarqueeTech`, `WritingSliderSection`, `Testimonials`.

---

## Requirements

### Requirement 1: Dependency and route reconstruction

**User Story:** As the site owner, I want the interrupted LandingPage work
restored on a committed footing, so that it cannot be lost to a branch switch
again.

#### Acceptance Criteria

1. THE project SHALL declare `@react-three/fiber` and `@react-three/drei` as
   production dependencies in `package.json`, with `package-lock.json` updated
   in the same commit.
2. THE project SHALL keep `three` and `@types/three` at versions compatible with
   the installed `@react-three/fiber` major, verified by `npm run typecheck`
   passing.
3. THE `LandingPage` component SHALL be committed to version control.
4. WHEN `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`
   are run after the dependency change, THEN each SHALL exit zero.
5. THE `LandingPage` component SHALL NOT be wired into `src/app/page.tsx` until
   Requirement 5 is satisfied.

---

### Requirement 2: Model asset optimisation

**User Story:** As a maintainer, I want the 3D asset small enough to ship, so
that the repository stays usable and the deployment succeeds.

#### Acceptance Criteria

1. THE Source_Model SHALL NOT be committed to git in its current form.
2. THE Optimised_Model SHALL be **at most 8 MB** on disk.
3. THE Optimised_Model SHALL be produced by a documented, repeatable command,
   recorded in the design document, so the transform can be re-run when the
   source changes.
4. THE Optimised_Model SHALL use Draco or meshopt geometry compression and KTX2
   or WebP texture compression.
5. IF the Optimised_Model exceeds 2 MB THEN the Asset_Origin SHALL be Supabase
   Storage rather than `public/`, per the asset budget in
   [structure.md](../../steering/structure.md#asset-budget).
6. IF the Asset_Origin is Supabase Storage THEN `next.config.ts` SHALL already
   permit that host — `*.supabase.co` is present in both `images.remotePatterns`
   and the CSP `img-src` and `connect-src` directives — and the design SHALL
   confirm no CSP change is required for `fetch`-loaded GLB.
7. THE repository SHALL retain no untracked multi-megabyte asset after this
   spec completes; `public/models/barong.glb` SHALL be deleted or replaced by
   the Optimised_Model.
8. WHEN the Source_Model is unavailable at build time THEN the build SHALL
   still succeed, because the Scene loads the model at runtime, not at build
   time.

---

### Requirement 3: The 3D Scene

**User Story:** As a visitor, I want an interactive 3D centrepiece on the
landing page, so that the portfolio demonstrates the capability it claims.

#### Acceptance Criteria

1. THE Scene SHALL render the Optimised_Model inside a React Three Fiber
   `<Canvas>`.
2. THE Scene SHALL be loaded with `next/dynamic` and `ssr: false`, imported
   from within a Client Component — `ssr: false` is a hard error in a Server
   Component in Next.js 16.
3. THE Scene SHALL render a `loading` placeholder occupying the same layout box
   as the loaded Scene, so no cumulative layout shift is introduced.
4. THE Scene SHALL respond to pointer movement with a camera or model rotation
   bounded to a fixed range, and SHALL NOT allow free user zoom or pan.
5. WHEN the Scene's model fails to load THEN THE LandingPage SHALL render the
   Fallback_Visual and SHALL NOT render an error to the viewer.
6. THE Scene SHALL dispose of its geometries, materials, textures, and
   renderer on unmount, leaving no retained WebGL context.
7. WHILE the Scene is off-screen THE Scene SHALL pause its render loop.

---

### Requirement 4: Performance budget

**User Story:** As a visitor on a mid-range phone, I want the landing page to
load and respond quickly, so that the 3D does not cost me the page.

#### Acceptance Criteria

1. THE Optimised_Model transfer size SHALL be at most 8 MB, and the Scene SHALL
   NOT begin fetching it until the `<Canvas>` is mounted.
2. THE JavaScript added to the `/` route by the Scene and its dependencies SHALL
   be at most **250 KB gzipped**, measured as the delta in `next build` route
   output before and after.
3. THE Scene SHALL sustain at least **30 fps** on a device simulating 4× CPU
   throttling, measured over a 10-second window.
4. THE LandingPage SHALL reach Largest Contentful Paint within **2.5 s** on a
   simulated Fast 3G, 4× CPU profile. The LCP element SHALL be text or a 2D
   image, never the Scene.
5. IF `window.matchMedia("(prefers-reduced-motion: reduce)")` matches THEN THE
   LandingPage SHALL render the Fallback_Visual and SHALL NOT mount the
   `<Canvas>`.
6. IF a WebGL2 context cannot be created THEN THE LandingPage SHALL render the
   Fallback_Visual.
7. IF `navigator.hardwareConcurrency` is 4 or fewer, OR
   `navigator.deviceMemory` is present and below 4, THEN THE LandingPage SHALL
   render the Fallback_Visual.
8. THE Fallback_Visual SHALL be a static image or CSS composition requiring no
   WebGL and no additional JavaScript beyond what the LandingPage already loads.
9. THE Scene SHALL cap its device pixel ratio at 2.

---

### Requirement 5: Relationship to the existing hero

**User Story:** As a maintainer, I want exactly one WebGL hero in the bundle, so
that the page does not carry two renderers.

#### Acceptance Criteria

1. THE design document SHALL state explicitly whether the LandingPage **replaces**
   Legacy_Home, **replaces only** the Existing_Hero within Legacy_Home, or is
   served at a **separate route**.
2. THE `/` route SHALL mount **at most one** WebGL context at a time.
3. IF the LandingPage replaces the Existing_Hero THEN `HeroSection`,
   `MaskReveal`, `HeroOverlay`, `MobileHero`, and
   `src/lib/fluid-simulation/FluidSimulation.ts` SHALL either be deleted in the
   same change or documented as retained with the reason.
4. IF the Existing_Hero is retained THEN the hero texture `<link rel="preload">`
   tags in `src/app/page.tsx` SHALL be retained, since they are media-gated to
   `≥768px` and feed `MaskReveal`'s `TextureLoader`.
5. IF the Existing_Hero is removed THEN those preload tags SHALL be removed in
   the same change, so the page does not fetch unused textures at high priority.
6. THE change SHALL preserve the `/` route's existing `export const revalidate = 60`.
7. THE change SHALL preserve the `ProfilePage` JSON-LD block on `/`, serialized
   through `jsonLdHtml()`.

---

### Requirement 6: Content wiring

**User Story:** As the site owner, I want the landing page to show my real
content from the CMS, not the placeholder data it ships with.

#### Acceptance Criteria

1. THE LandingPage SHALL receive its content as props from a Server Component.
2. THE calling Server Component SHALL source content from `getSettings()` and,
   where a field has no `SiteSettings` equivalent, from a documented constant.
3. THE LandingPage SHALL NOT retain the hardcoded `'Devina Studio'` placeholder
   object currently in `src/app/page.tsx` on the untracked branch.
4. THE LandingPage SHALL keep its existing per-field fallback behaviour, so a
   missing prop renders a sensible default rather than an empty element.
5. WHEN Supabase is unconfigured THEN THE LandingPage SHALL render from
   `defaultSettings`, consistent with
   [ADR-002](../../steering/decisions.md#adr-002--seed-data-fallback-instead-of-an-error-state).
6. THE `TenantData` interface SHALL remain exported, unchanged in field names,
   so a future multi-tenant caller can supply a `Profile`-derived object without
   a rename.

---

### Requirement 7: Accessibility and motion

**User Story:** As a visitor using assistive technology or reduced motion, I
want the landing page to be fully usable.

#### Acceptance Criteria

1. THE LandingPage SHALL expose exactly one `<h1>`.
2. THE `<Canvas>` element SHALL be `aria-hidden="true"`, being decorative, and
   all meaning SHALL be available in the surrounding text.
3. THE GSAP entrance timeline SHALL leave every animated element at
   `opacity: 1` and its natural transform when the animation completes or is
   skipped.
4. IF reduced motion is requested THEN the GSAP entrance timeline SHALL NOT run,
   and all content SHALL be immediately visible — **not** animated faster.
5. THE skill pills and stat cards SHALL be keyed by a stable identifier, not by
   array index.
6. THE two CTAs SHALL be reachable and operable by keyboard with a visible focus
   indicator.
7. THE LandingPage SHALL render correctly in both light and dark themes. The
   component currently hardcodes `slate-*` and `bg-slate-950`, which ignores the
   `--bg` / `--fg` CSS variables; it SHALL be migrated to the project's token
   system per [tech.md](../../steering/tech.md#styling).

---

### Requirement 8: Verification

**User Story:** As a reviewer, I want the performance claims to be measured
rather than asserted.

#### Acceptance Criteria

1. THE implementation SHALL record the measured values for Requirement 4
   criteria 2, 3, and 4 in `tasks.md`, with the tool and device profile used.
2. THE implementation SHALL include a unit test asserting that the
   Fallback_Visual renders when `matchMedia` reports reduced motion.
3. THE implementation SHALL include a unit test asserting that the
   Fallback_Visual renders when WebGL2 context creation fails.
4. THE `<Canvas>` SHALL be mocked in the test environment; jsdom provides no
   WebGL and tests SHALL NOT attempt real rendering.
5. WHEN `npm run test` is run THEN no test SHALL depend on the Optimised_Model
   being present on disk.
