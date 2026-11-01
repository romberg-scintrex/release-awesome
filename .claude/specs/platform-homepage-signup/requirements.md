# Requirements — Platform Homepage & Signup

## Introduction

The product is a multi-tenant portfolio platform: anyone registers, and each
approved user gets a portfolio at `/:username` plus an admin panel to customise
it. Branch `0010` builds the tenant surface. **Nothing builds the platform
surface.**

Verified across both branches: there is no `/register` route, no `signUp` call
anywhere in `src/`, and no `profiles.status` column. The only auth call is
`signInWithPassword` in `src/app/admin/login/page.tsx`. `/` is still one
person's portfolio, and `handle_new_user()` can mint usernames that are
permanently unreachable because they collide with static routes.

This spec builds the platform surface and closes the four foundations the
product cannot ship without: a homepage, registration with approval, safe
username allocation, and tenant-correct contact delivery.

## Baseline assumptions

- **Requires `feature/release-awesome/0010` to be merged first.** This spec
  edits `supabase/migrations/0005_multi_tenant.sql`, `profiles`,
  `handle_new_user()`, and the `(portfolio)/[username]` route group — none of
  which exist on `development`.
- The build gate must be green before task 1. See
  [current-state.md](../../steering/current-state.md#build-health).
- Governing decisions, already made:
  [ADR-015](../../steering/decisions.md#adr-015--the-root-is-the-platform-not-a-portfolio),
  [ADR-016](../../steering/decisions.md#adr-016--waitlist-with-manual-approval),
  [ADR-017](../../steering/decisions.md#adr-017--all-users-are-equal-tenants-no-platform-admin-role),
  [ADR-018](../../steering/decisions.md#adr-018--remove-casbin).
- The 3D hero is specified separately in
  [`specs/landing-3d-experience`](../landing-3d-experience/requirements.md). This
  spec owns the homepage's structure, copy, and conversion path; that spec owns
  the scene.

## Glossary

- **Platform_Surface**: Routes at the root serving the product itself — `/`,
  `/register`, `/login`, `/admin/*`, `/api/*`.
- **Tenant_Surface**: `/:username` and below, serving one tenant's portfolio.
- **Tenant**: A registered user. There is exactly one kind of user.
- **Operator**: The person who approves registrations, working in the Supabase
  dashboard. Not a role in the application.
- **Profile_Status**: A new `profiles.status` column, one of `pending`,
  `approved`, `rejected`.
- **Auth_Trigger**: `public.handle_new_user()`, fired after insert on
  `auth.users`.
- **Reserved_Segment**: A username that must never be allocated because it
  collides with a static route or a word the platform may claim.
- **Username_Policy**: The combined format, reservation, and uniqueness rules
  governing username allocation.
- **Registration_Form**: The client form at `/register`.
- **Pending_Notice**: What `/admin` shows a Tenant whose Profile_Status is not
  `approved`.
- **Contact_Recipient**: The email address a contact-form submission is
  delivered to. **This is `auth.users.email`, not `profiles.email`** — see
  Requirement 8.

---

## Requirements

### Requirement 1: Platform homepage

**User Story:** As a prospective user, I want the homepage to explain the
product and let me sign up, so that I understand what I am registering for.

#### Acceptance Criteria

1. THE Platform_Surface SHALL serve `/` as the platform homepage, not any
   individual's portfolio.
2. THE homepage SHALL present the product's value proposition, a primary
   call-to-action linking to `/register`, and a secondary link to `/login`.
3. THE homepage SHALL show at least one concrete example of what the product
   produces — a link to a real tenant portfolio, or a visual representation of
   one.
4. THE homepage SHALL NOT read `getSettings()`, `getTestimonials()`, or
   `getTools()`, because none of those describes the platform.
5. THE homepage SHALL render correctly when Supabase is unconfigured, since it
   depends on no tenant data.
6. THE homepage SHALL declare `export const revalidate = 60`.
7. THE homepage SHALL expose exactly one `<h1>`.
8. THE homepage SHALL render correctly in both light and dark themes using the
   project's CSS custom properties, not hardcoded colours.

---

### Requirement 2: Remove the owner's portfolio from the root

**User Story:** As a maintainer, I want the root to contain only platform
routes, so that usernames cannot be shadowed by leftover pages.

#### Acceptance Criteria

1. THE Platform_Surface SHALL delete `src/app/about/`, `src/app/contact/`,
   `src/app/blog/`, and `src/app/blog/[slug]/`.
2. THE root layout SHALL NOT use a title template naming an individual. The
   current template is `"%s - Gregorius Dimas A Yudhana"`.
3. THE root layout SHALL NOT emit `Person` JSON-LD describing the primary
   owner. Platform-level structured data SHALL be `WebSite`, and `Person` /
   `ProfilePage` SHALL appear only on Tenant_Surface pages.
4. THE root layout SHALL NOT carry the current `keywords` array, which is one
   individual's SEO.
5. THE root layout `metadata.description`, `openGraph`, and `twitter` fields
   SHALL describe the platform.
6. WHEN the deletion is complete THEN the primary owner's content SHALL remain
   reachable at `/dimasyudhana` and below, like any other Tenant.
7. THE `Navbar` and `CommandPalette` SHALL be updated so no entry points at a
   deleted route.
8. THE deletion SHALL NOT remove `src/app/opengraph-image.tsx`,
   `src/app/not-found.tsx`, or `src/app/api/contact/route.ts`.

---

### Requirement 3: Username policy

**User Story:** As a user, I want my chosen username to work as a URL, so that
my portfolio is actually reachable.

#### Acceptance Criteria

1. THE Username_Policy SHALL require usernames to match
   `^[a-z0-9]+(?:-[a-z0-9]+)*$`, 3 to 40 characters — lowercase alphanumeric
   groups joined by **single** hyphens.

   > Corrected 2026-11-01. This previously read
   > `^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$`, which **admits `a--b`**. The
   > Auth_Trigger collapses `-{2,}` to `-` and then rejects the result for
   > differing from the submitted value, so the old pattern would have let the
   > Registration_Form accept a username the database refuses — the exact
   > form-versus-database disagreement Requirement 3.4 exists to prevent.
2. THE Auth_Trigger SHALL lowercase and sanitise any derived username before
   use, stripping or replacing every character outside the allowed set.
3. THE Auth_Trigger SHALL reject every Reserved_Segment. The list SHALL at
   minimum include every static root path — `admin`, `api`, `register`,
   `login`, `_next`, `favicon.ico`, `opengraph-image`, `robots.txt`,
   `sitemap.xml` — and the claimable words `about`, `contact`, `blog`, `tools`,
   `settings`, `dashboard`, `pricing`, `terms`, `privacy`, `docs`, `help`,
   `support`, `new`, `edit`, `static`, `assets`, `public`, `www`, `mail`.
4. THE Reserved_Segment list SHALL live in **one** place readable by both the
   database and the application, so the two can never disagree.
5. WHEN a username derived from an email address is reserved or malformed THEN
   the Auth_Trigger SHALL allocate a safe alternative rather than failing the
   signup, because the user did not choose it.
6. WHEN a username explicitly submitted by a user is reserved, malformed, or
   taken THEN the Registration_Form SHALL reject it with a message naming the
   reason, and SHALL NOT silently substitute a different username.
7. THE Auth_Trigger SHALL resolve collisions against existing `profiles` rows,
   preserving the current numeric-suffix behaviour.
8. THE uniqueness guarantee SHALL be case-insensitive, so `John` and `john`
   cannot both exist.
9. THE Username_Policy SHALL be enforced in the database. The
   Registration_Form's checks exist only to give a fast, readable error and
   SHALL NOT be the only control.

---

### Requirement 4: Registration

**User Story:** As a prospective user, I want to register for a portfolio, so
that I can start using the product.

#### Acceptance Criteria

1. THE Platform_Surface SHALL serve `/register` with fields for username,
   email, and password.
2. THE Registration_Form SHALL call `supabase.auth.signUp` with the chosen
   username in `raw_user_meta_data.username`, which the Auth_Trigger reads.
3. THE Registration_Form SHALL validate username format against the
   Username_Policy before submitting, and SHALL report a reserved or malformed
   username inline.
4. THE Registration_Form SHALL verify a Cloudflare Turnstile token
   server-side before creating the account, reusing the pattern in
   `src/app/api/contact/route.ts`.
5. THE Registration_Form SHALL rate-limit submissions per IP.
6. WHEN registration succeeds THEN the Tenant SHALL be signed in and
   redirected to `/admin`.
7. WHEN the Auth_Trigger rejects a username THEN the Registration_Form SHALL
   surface a readable message, not a raw Postgres error.
8. IF Supabase is unconfigured THEN `/register` SHALL state that registration
   is unavailable and SHALL NOT render a form that cannot work.
9. THE Registration_Form SHALL NOT disclose whether an email address is already
   registered, beyond what Supabase Auth itself returns.
10. THE Registration_Form SHALL be keyboard-operable with labelled controls and
    a visible focus indicator.

---

### Requirement 5: Approval gating

**User Story:** As the Operator, I want to approve portfolios before they go
live, so that squatting and spam portfolios do not become public.

#### Acceptance Criteria

1. THE `profiles` table SHALL gain a `status` column constrained to
   `pending`, `approved`, `rejected`, defaulting to `pending`.
2. THE Auth_Trigger SHALL create every new row with `status = 'pending'`.
3. WHEN a Tenant_Surface route resolves a profile whose Profile_Status is not
   `approved` THEN the route SHALL call `notFound()`.
4. THE `notFound()` response for an unapproved Tenant SHALL be
   indistinguishable from that of a non-existent username — no title, no
   OpenGraph, no canonical — so Profile_Status is not publicly enumerable.
5. THE anonymous RLS read policy on `profiles` SHALL return only rows where
   `status = 'approved'`, so gating does not depend on application code alone.
6. THE RLS policies on `projects`, `testimonials`, `about_scenes`, and `blogs`
   SHALL return rows to anonymous readers only when the owning profile is
   `approved`.
7. A Tenant whose Profile_Status is `pending` or `rejected` SHALL still be able
   to sign in and use the full CMS, so content can be prepared before approval.
8. WHEN a Tenant whose Profile_Status is not `approved` opens `/admin` THEN the
   Pending_Notice SHALL state the current status and what happens next.
9. THE Pending_Notice SHALL NOT block access to the CMS.
10. THE implementation SHALL document, in `tasks.md`, the exact SQL an Operator
    runs to approve a Tenant.
11. THE migration SHALL set `status = 'approved'` for profiles that exist at
    migration time, so the current owner's portfolio does not disappear.

---

### Requirement 6: Sign-in relocation

**User Story:** As a Tenant, I want to sign in from a URL that belongs to the
platform, not to the admin panel.

#### Acceptance Criteria

1. THE Platform_Surface SHALL serve sign-in at `/login`.
2. `/admin/login` SHALL redirect permanently to `/login`, preserving any
   `redirect` query parameter.
3. THE sign-in page SHALL preserve the existing open-redirect protection: a
   `redirect` parameter is followed only when it starts with `/` and does not
   start with `//`.
4. `src/proxy.ts` SHALL redirect unauthenticated `/admin` requests to `/login`
   with the original path in a `redirect` parameter.
5. `src/proxy.ts` SHALL redirect an authenticated Tenant away from `/login` and
   `/register` to `/admin`.
6. THE sign-in page SHALL link to `/register`, and the Registration_Form SHALL
   link to `/login`.

---

### Requirement 7: Remove Casbin

**User Story:** As a maintainer, I want authorization to match the product's
one-kind-of-user model, so that a newly registered Tenant can edit their own
portfolio.

#### Acceptance Criteria

1. THE implementation SHALL delete `src/lib/casbin/enforcer.ts` and
   `src/lib/casbin/model.conf`.
2. THE implementation SHALL remove the `casbin_rule` table and its seed data
   from `supabase/migrations/0005_multi_tenant.sql`.
3. THE implementation SHALL remove the `casbin` dependency from `package.json`,
   committing `package-lock.json` in the same change.
4. `AdminNavbar` SHALL render a fixed list of nav items and SHALL NOT take a
   `visibleItems` prop.
5. `src/app/admin/layout.tsx` SHALL NOT call `getVisibleNavItems`.
6. WHEN a newly registered Tenant opens `/admin` THEN every nav item SHALL be
   visible, scoped by RLS to that Tenant's own rows.
7. THE removal SHALL NOT weaken route protection: `src/proxy.ts` remains the
   route-level guard and `requireAdmin()` remains the mutation-level guard.
8. THE removal SHALL leave the Casbin enforcer as `SUPABASE_SERVICE_ROLE_KEY`'s
   former only consumer. **The key SHALL be retained**, because Requirement 8.2
   introduces a new legitimate consumer: reading `auth.users.email`, which the
   anon client cannot access.

---

### Requirement 8: Tenant-correct contact delivery

**User Story:** As a Tenant, I want messages sent through my portfolio's
contact form to reach me, not the platform operator.

#### Acceptance Criteria

1. THE contact handler SHALL accept the Tenant's `username` in the request
   payload.
2. THE contact handler SHALL resolve the Contact_Recipient from
   **`auth.users.email`** for the profile matching that username, and SHALL
   NOT use `profiles.email`.
3. WHEN the username does not resolve, OR the profile's Profile_Status is not
   `approved`, OR no auth email exists THEN the handler SHALL return an error
   and SHALL NOT fall back to `CONTACT_TO_EMAIL`.
4. THE handler SHALL retain all five existing security layers in order:
   honeypot, rate limit, server-side validation, Turnstile, then delivery.
5. THE handler SHALL continue to HTML-escape every user-supplied value before
   templating the email.
6. THE handler SHALL set `replyTo` to the sender's address, as it does today.
7. `src/components/Fragments/ContactForm/index.tsx` and
   `src/hooks/useContactForm.ts` SHALL pass the Tenant's `username` through to
   the handler.
8. THE Contact_Recipient SHALL never be derived from a client-supplied email
   address, nor from any field a Tenant can edit.
9. THE implementation SHALL include a test asserting that a submission for
   tenant A does not deliver to tenant B's address or to `CONTACT_TO_EMAIL`.
10. `profiles.email` is a Tenant-editable free-text field, displayed publicly on
    the Tenant's contact page. IT SHALL remain display-only and SHALL NOT be
    used as a delivery target.
11. THE `from` address SHALL be a verified platform domain. `onboarding@resend.dev`
    SHALL NOT be used as the fallback sender, because Resend restricts it to the
    account owner's own address and returns 403 for any other recipient.
12. IF no verified sender domain is configured THEN the handler SHALL return a
    configuration error rather than attempting delivery.
13. THE handler SHALL rate-limit per target Tenant in addition to per IP, so the
    platform's sender reputation cannot be consumed against one recipient.

---

### Requirement 9: Verification

**User Story:** As a reviewer, I want tenant isolation and username safety
proven, not assumed.

#### Acceptance Criteria

1. THE implementation SHALL include a test asserting that every
   Reserved_Segment is rejected by the Username_Policy.
2. THE implementation SHALL include a test asserting that an unapproved
   Tenant's portfolio returns `notFound()` and emits no metadata.
3. THE implementation SHALL include a test asserting that username uniqueness
   is case-insensitive.
4. THE implementation SHALL include the Requirement 8.9 cross-tenant delivery
   test.
5. THE implementation SHALL verify manually that registering with an email
   whose local part is `admin` produces a reachable portfolio at a safe
   username.
6. THE implementation SHALL verify manually that every static root path still
   resolves to its platform page after a tenant with a similar name exists.
7. WHEN `npm run typecheck`, `npm run lint`, `npm run test`, and
   `npm run build` are run THEN each SHALL exit zero.
