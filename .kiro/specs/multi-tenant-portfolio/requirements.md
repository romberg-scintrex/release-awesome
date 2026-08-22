# Requirements Document

## Introduction

This feature transforms the existing single-tenant portfolio (hardcoded to one owner) into a multi-tenant platform where each registered user gets a fully isolated public portfolio at `/:username`. The platform supports per-user content tables (`projects`, `testimonials`, `about_scenes`, `blogs`), a `profiles` table replacing the `site_settings` singleton, automatic profile creation on signup, and a Casbin.js RBAC layer that controls admin navbar visibility. Migration from the current single-tenant schema must be non-destructive so the existing owner's content is preserved.

## Glossary

- **Profile**: A row in the `profiles` table representing one tenant's identity data (name, username, role, socials, hero images, CV). Replaces the `site_settings` singleton.
- **Username**: The unique, URL-safe slug identifier for a tenant, e.g. `dimasyudhana`. Sourced from `raw_user_meta_data.username` on signup.
- **Tenant**: A single registered user whose portfolio is served under `/:username`.
- **Portfolio_Router**: The Next.js App Router segment at `src/app/[username]/` that resolves public portfolio pages per tenant.
- **Data_Layer**: The set of query functions in `src/lib/queries.ts` and `src/lib/queries-by-user.ts` that fetch data scoped to a specific `user_id`.
- **Casbin_Enforcer**: The server-side Casbin.js `newEnforcer` instance loaded from the `casbin_rule` Postgres table via the Supabase PostgreSQL adapter.
- **RBAC_Policy**: A row in `casbin_rule` that grants a subject (user email or role name) the ability to perform an action on an object (nav item key).
- **CasbinRule**: The Prisma model / Supabase table `casbin_rule` with columns `id`, `ptype`, `v0`–`v5`.
- **Nav_Item**: A navigable section of the admin panel (e.g. `dashboard`, `projects`, `blog`, `settings`). Visibility is controlled by RBAC policies.
- **Auth_Trigger**: The Supabase PostgreSQL function `handle_new_user` that fires `after insert on auth.users` and creates a matching row in `profiles`.
- **Storage_Path**: The Supabase Storage object key prefix `media/{user_id}/` that isolates uploaded files per tenant.
- **RLS**: Row Level Security — PostgreSQL policies enforced by Supabase on every table.
- **Migration**: A numbered SQL file under `supabase/migrations/` applied in sequence to evolve the database schema.
- **Seed_Data**: Fallback in-memory data used when Supabase is not configured, defined in `src/lib/default.ts`.
- **ISR**: Incremental Static Regeneration — Next.js `revalidate = 60` on public pages.
- **Admin_Panel**: The authenticated CMS at `/admin` used by each tenant to manage their own content.

---

## Requirements

### Requirement 1: Profiles Table (Multi-Tenant Identity)

**User Story:** As a platform owner, I want each registered user to have a dedicated profile row, so that tenant identity data is fully isolated and the `site_settings` singleton is no longer required.

#### Acceptance Criteria

1. THE Migration SHALL create a `profiles` table with columns: `id` (UUID, primary key, references `auth.users(id)` on delete cascade), `username` (text, unique, not null), `name` (text, not null), `short_name` (text), `role` (text), `university` (text), `location` (text), `email` (text), `description` (text), `social_github` (text), `social_linkedin` (text), `social_facebook` (text), `social_instagram` (text), `hero_back_url` (text), `hero_front_url` (text), `hero_mobile_url` (text), `about_image_url` (text), `cv_url` (text), `created_at` (timestamptz), `updated_at` (timestamptz).
2. THE Migration SHALL create a unique index on `profiles(username)` and an index on `profiles(id)`.
3. THE Migration SHALL enable RLS on `profiles` with a policy that allows anonymous users to read any row (public profiles are visible), and authenticated users to read and write only their own row where `auth.uid() = id`.
4. THE Migration SHALL create or replace data migration logic that explicitly depends on the `profiles` table existing before migrating `site_settings` data — IF the `profiles` table creation has not succeeded, THEN the data migration step SHALL fail immediately with a descriptive error rather than silently skipping.
5. THE Migration SHALL NOT drop `site_settings` until a subsequent migration confirms data integrity, allowing for rollback during the transition period.

---

### Requirement 2: Content Tables — Per-User Isolation

**User Story:** As a tenant, I want my projects, testimonials, about scenes, and blog posts to be completely isolated from other tenants, so that only my content appears on my public portfolio pages.

#### Acceptance Criteria

1. THE Migration SHALL add a `user_id` column (UUID, not null, references `profiles(id)` on delete cascade) to the `projects`, `testimonials`, `about_scenes`, and `blogs` tables.
2. THE Migration SHALL backfill the `user_id` column on existing rows in `projects`, `testimonials`, and `about_scenes` with the `profiles.id` of the migrated owner profile.
3. THE Migration SHALL update RLS policies on `projects`, `testimonials`, and `about_scenes` so that anonymous users may only read rows where `published = true`, and authenticated users may only read and write rows where `user_id = (select id from profiles where id = auth.uid())`. The policies MUST both be updated AND correctly implement these access rules — updating policy definitions without enforcing the correct conditions is insufficient.
4. THE Migration SHALL create a `blogs` table with columns: `id` (UUID, primary key), `user_id` (UUID, not null, references `profiles(id)` on delete cascade), `slug` (text, not null), `title` (text, not null), `summary` (text), `content` (text — Markdown), `cover_url` (text), `published` (boolean, default false), `published_at` (timestamptz), `created_at` (timestamptz), `updated_at` (timestamptz), with a unique constraint on `(user_id, slug)`.
5. THE Migration SHALL create indexes on `blogs(user_id, published, published_at desc)` and `blogs(slug)` for efficient per-user listing and slug lookup.
6. THE Migration SHALL enable RLS on `blogs` with policies: anonymous users read rows where `published = true`, authenticated users read and write only rows where `user_id = (select id from profiles where id = auth.uid())`.

---

### Requirement 3: Automatic Profile Creation on Signup

**User Story:** As a new user signing up, I want my profile to be created automatically with my chosen username, so that my portfolio URL is immediately available without manual setup.

#### Acceptance Criteria

1. THE Migration SHALL create or replace a PostgreSQL function `handle_new_user()` that reads `new.raw_user_meta_data->>'username'` and `new.raw_user_meta_data->>'name'` and inserts a row into `profiles(id, username, name)`.
2. WHEN a new row is inserted into `auth.users`, THE Auth_Trigger SHALL execute `handle_new_user()` for each row.
3. IF `raw_user_meta_data->>'username'` is null or empty at signup time, THEN THE Auth_Trigger SHALL fall back to using the left part of the user's email address (before `@`) as the username.
4. IF the derived username already exists in `profiles`, THEN THE Auth_Trigger SHALL append a 4-digit numeric suffix (e.g. `dimasyudhana_1234`) to produce a unique username, retrying until the value is unique.
5. THE `handle_new_user` function SHALL be defined with `security definer` to allow insertion into `profiles` bypassing RLS during the trigger context.

---

### Requirement 4: Casbin Rule Table and RBAC Model

**User Story:** As a platform administrator, I want access control policies stored in the database, so that per-user admin navbar visibility can be managed without code changes.

#### Acceptance Criteria

1. THE Migration SHALL create a `casbin_rule` table with columns: `id` (serial primary key), `ptype` (text), `v0` (text), `v1` (text), `v2` (text), `v3` (text), `v4` (text), `v5` (text).
2. THE Migration SHALL seed initial policies into `casbin_rule`: role `admin` may perform `read` on each of `dashboard`, `projects`, `blog`, `settings`; role `editor` may perform `read` on each of `dashboard`, `projects`, `blog`; user `dimas` is assigned role `admin`; user `yudhana` is assigned role `editor`.
3. THE Casbin_Enforcer SHALL use the RBAC model: `[request_definition] r = sub, obj, act`, `[policy_definition] p = sub, obj, act`, `[role_definition] g = _, _`, `[policy_effect] e = some(where (p.eft == allow))`, `[matchers] m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act`.
4. THE Casbin_Enforcer SHALL be initialized server-side using the `casbin` npm package with a PostgreSQL adapter reading from the `casbin_rule` table via the Supabase connection string.
5. THE Casbin_Enforcer SHALL be instantiated once per request in a server function and NOT stored in global module scope to avoid cross-request state leakage in the Next.js edge/serverless environment.
6. IF the `casbin_rule` table is completely unreachable or returns an explicit error, THEN THE Casbin_Enforcer SHALL deny all policy checks and return an empty nav item list, preventing unauthorized access escalation. WHEN the database connection exists but returns no data or partial data, THE Casbin_Enforcer SHALL evaluate only the policies actually returned (empty policy set = deny all).

---

### Requirement 5: Dynamic Public Portfolio Routes

**User Story:** As a visitor, I want to access any registered user's public portfolio via `/:username`, `/:username/about`, `/:username/contact`, `/:username/blog`, and `/:username/blog/[slug]`, so that each tenant has their own branded public presence.

#### Acceptance Criteria

1. THE Portfolio_Router SHALL resolve `/:username` to a hero/home page that fetches and renders the profile and published projects for the matching `profiles.username`.
2. THE Portfolio_Router SHALL resolve `/:username/about` to an about page that fetches and renders the profile, `about_scenes`, and timeline data for the matching username.
3. THE Portfolio_Router SHALL resolve `/:username/contact` to a contact page that fetches the profile email and socials for the matching username and renders the contact form.
4. THE Portfolio_Router SHALL resolve `/:username/blog` to a blog index page that lists all published `blogs` rows for the matching username, ordered by `published_at desc`.
5. THE Portfolio_Router SHALL resolve `/:username/blog/[slug]` to a blog detail page that fetches the single published blog post matching `(username, slug)` and renders the Markdown `content` field.
6. WHEN a `/:username` request is received and no `profiles` row exists with that username, THE Portfolio_Router SHALL call Next.js `notFound()` to render the 404 page.
7. WHEN a `/:username/blog/[slug]` request is received and no matching published blog post exists, THE Portfolio_Router SHALL call `notFound()`.
8. THE Portfolio_Router SHALL export `revalidate = 60` on all public portfolio pages for ISR.
9. THE Portfolio_Router SHALL generate per-tenant `<Metadata>` including `title`, `description`, `openGraph`, and `alternates.canonical` populated from the resolved profile data.
10. WHERE the `/:username` segment conflicts with existing top-level routes (`/admin`, `/api`, `/about`, `/contact`, `/blog`), THE Portfolio_Router SHALL NOT shadow those routes — the `[username]` dynamic segment MUST be placed in a route group or at a path level that does not conflict.

---

### Requirement 6: Data Layer — Username-Scoped Queries

**User Story:** As a developer, I want query functions that accept a username parameter and return only that user's data, so that public portfolio pages display per-tenant content correctly.

#### Acceptance Criteria

1. THE Data_Layer SHALL expose a `getProfileByUsername(username: string): Promise<Profile | null>` function that performs a single `profiles` lookup by `username` using the anon Supabase client.
2. THE Data_Layer SHALL expose a `getProjectsByUsername(username: string): Promise<Project[]>` function that joins `profiles` on `username` and returns published `projects` for that user.
3. THE Data_Layer SHALL expose a `getTestimonialsByUsername(username: string): Promise<Testimonial[]>` function returning published `testimonials` for that user.
4. THE Data_Layer SHALL expose a `getAboutScenesByUsername(username: string): Promise<AboutScene[]>` function returning `about_scenes` ordered by `scene_order` for that user.
5. THE Data_Layer SHALL expose a `getBlogsByUsername(username: string): Promise<BlogPost[]>` function returning published `blogs` for that user ordered by `published_at desc`.
6. THE Data_Layer SHALL expose a `getBlogByUsernameAndSlug(username: string, slug: string): Promise<BlogPost | null>` function.
7. ALL username-scoped query functions SHALL be wrapped in `React.cache()` for per-render deduplication.
8. ALL username-scoped query functions SHALL follow the existing pattern: never throw, return a safe empty fallback on error, and return `null` or `[]` when Supabase is not configured.
9. THE Data_Layer SHALL define a `Profile` domain type (camelCase) and a `ProfileRow` interface with a `mapProfileRow()` mapper function following the existing row-mapping convention in `queries.ts`.
10. THE Data_Layer SHALL define a `BlogPost` domain type (camelCase) and a `BlogPostRow` interface with a `mapBlogPostRow()` mapper following the existing convention.

---

### Requirement 7: Admin Panel — RBAC-Controlled Navbar

**User Story:** As an admin user, I want the admin navbar to show only the sections I am authorized to access according to my Casbin role, so that the UI reflects my actual permissions without exposing unauthorized routes.

#### Acceptance Criteria

1. THE Admin_Panel layout SHALL fetch the authenticated user's email from Supabase, then query the Casbin_Enforcer to determine which nav items the user may `read`.
2. THE NavbarAdmin component SHALL accept a `visibleItems` prop (array of `Nav_Item` keys) and render only those items, instead of rendering a hardcoded list.
3. WHEN the Casbin_Enforcer grants `read` access to `dashboard`, THE NavbarAdmin SHALL include a link to `/admin`. IF the link rendering fails for any reason despite valid permissions, THE NavbarAdmin SHALL silently omit the link rather than propagating the error.
4. WHEN the Casbin_Enforcer grants `read` access to `projects`, THE NavbarAdmin SHALL include a link to `/admin/projects`. IF the link rendering fails for any reason despite valid permissions, THE NavbarAdmin SHALL silently omit the link rather than propagating the error.
5. WHEN the Casbin_Enforcer grants `read` access to `blog`, THE NavbarAdmin SHALL include a link to `/admin/blog`. IF the link rendering fails for any reason despite valid permissions, THE NavbarAdmin SHALL silently omit the link rather than propagating the error.
6. WHEN the Casbin_Enforcer grants `read` access to `settings`, THE NavbarAdmin SHALL include a link to `/admin/settings`. IF the link rendering fails for any reason despite valid permissions, THE NavbarAdmin SHALL silently omit the link rather than propagating the error.
7. IF the Casbin_Enforcer denies `read` access to a nav item, THE NavbarAdmin SHALL NOT render a link to that route.
8. THE Admin_Panel layout SHALL pass the computed `visibleItems` array down to `NavbarAdmin` as a server-prop, ensuring policy evaluation occurs server-side and is not exposed to the client.
9. THE Admin_Panel layout SHALL still guard all `/admin` routes via the existing middleware session check — Casbin controls visibility only, not route-level access enforcement.

---

### Requirement 8: Storage Path Isolation

**User Story:** As a tenant, I want my uploaded media files stored under a path prefix that includes my user ID, so that storage is isolated per user and accidental cross-tenant access is prevented.

#### Acceptance Criteria

1. WHEN an authenticated user uploads a file to the `media` Supabase Storage bucket, THE Storage upload path SHALL use the prefix `media/{user_id}/{filename}` where `user_id` is the authenticated user's `auth.uid()`.
2. THE Migration SHALL update the existing Storage RLS policies on `storage.objects` so that authenticated users may only insert, update, and delete objects where the storage path begins with `media/{auth.uid()}/`.
3. THE Migration SHALL retain the existing policy allowing anonymous users to read any object in the `media` bucket (public CDN access is unchanged).
4. THE Data_Layer upload helper in `src/lib/admin/upload.ts` SHALL construct the storage path as `${user_id}/${filename}` within the `media` bucket, replacing any existing flat-path logic.

---

### Requirement 9: Backward Compatibility and Migration Path

**User Story:** As the existing site owner, I want the migration to preserve all my current content and keep the single-tenant admin panel functional, so that the transition to multi-tenant does not require any manual data re-entry.

#### Acceptance Criteria

1. THE Migration SHALL be idempotent — applying it twice MUST NOT duplicate data or raise errors, using `if not exists` guards and `on conflict do nothing` for seed inserts.
2. THE Migration SHALL assign the existing `site_settings` owner as the first tenant in `profiles`, preserving their `username`, `name`, all social fields, all URL fields, and their existing `projects`, `testimonials`, and `about_scenes` rows via the `user_id` backfill.
3. WHEN the `profiles` table exists, THE Admin_Panel `/admin/settings` page SHALL read from `profiles` for the authenticated user rather than `site_settings`, switching immediately upon `profiles` table existence without falling back to `site_settings`.
4. THE existing top-level routes `/`, `/about`, `/contact` SHALL remain functional and continue to serve the primary owner's content, either by redirecting to `/:primary_username` or by reading from the `profiles` table directly, without displaying a 404.
5. IF a visitor accesses the root `/` route, THE Application SHALL serve the primary owner's portfolio (the first user created), maintaining backward compatibility with existing bookmarks and SEO-indexed URLs.

---

### Requirement 10: SEO and Metadata Per Tenant

**User Story:** As a tenant, I want each of my public portfolio pages to have correct SEO metadata derived from my profile, so that search engines index my portfolio under my name and username rather than generic or another user's data.

#### Acceptance Criteria

1. WHEN rendering `/:username`, THE Portfolio_Router SHALL generate a `<title>` of the form `{profile.name} – {profile.role}` and an OpenGraph `url` of `{siteUrl}/{username}`.
2. WHEN rendering `/:username/blog/[slug]`, THE Portfolio_Router SHALL generate a `<title>` of the form `{post.title} – {profile.name}` and an OpenGraph `description` from `post.summary`.
3. THE Portfolio_Router SHALL set `alternates.canonical` to the fully qualified URL of each portfolio page using the tenant's username.
4. WHEN a `/:username` page is requested for a username that does not exist, THE Application SHALL return an HTTP 404 status and SHALL NOT generate any SEO metadata (no `<title>`, no OpenGraph tags, no canonical link) for that URL.
5. THE Portfolio_Router SHALL NOT expose one tenant's metadata on another tenant's page under any routing or caching condition.

---

### Requirement 11: Casbin Policy Enforcement — Admin Route Access

**User Story:** As a security-conscious administrator, I want Casbin policy checks to occur server-side before rendering any admin page content, so that unauthorized users cannot access data by navigating directly to a URL.

#### Acceptance Criteria

1. THE Admin_Panel SHALL perform Casbin enforcement inside the Next.js Server Component layout, before any data-fetching child components are rendered.
2. WHEN the Casbin_Enforcer returns false for `enforce(userEmail, navItem, "read")`, THE Admin_Panel SHALL NOT render the admin page content for that route and SHALL redirect to `/admin` (the dashboard).
3. THE Admin_Panel SHALL use the authenticated user's Supabase email as the `sub` (subject) in Casbin enforce calls, matching the policy subjects stored in `casbin_rule.v0`.
4. IF no Casbin policies exist for the authenticated user or their assigned roles, THEN THE Admin_Panel SHALL actively grant `read` access to `dashboard` by default and deny access to all other nav items, ensuring the principle of least privilege while keeping the dashboard always accessible.
5. THE Casbin_Enforcer instance SHALL NOT be shared across concurrent requests — THE Admin_Panel SHALL create a fresh enforcer per request or use a stateless enforcement check.

