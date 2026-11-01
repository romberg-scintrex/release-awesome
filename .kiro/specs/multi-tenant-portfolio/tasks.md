# Implementation Plan: Multi-Tenant Portfolio

## Overview

Transform the single-tenant portfolio into a multi-tenant platform. Each registered user gets a fully isolated public portfolio at `/:username`. The implementation follows a strict dependency order: DB schema first, domain types second, data layer third, RBAC fourth, then UI and routes.

## Tasks

- [x] 1. Install dependencies
  - [x] 1.1 Install `casbin` as a production dependency
    - Run `npm install casbin` — adds the Casbin.js authorization library used for RBAC enforcement
    - Verify the package appears in `dependencies` in `package.json`
    - _Requirements: 4.4_
  - [x] 1.2 Install `fast-check` as a dev dependency
    - Run `npm install --save-dev fast-check` — adds the property-based testing library
    - Verify the package appears in `devDependencies` in `package.json`
    - _Requirements: (testing infrastructure for all correctness properties)_

- [x] 2. Database migration — create `supabase/migrations/0005_multi_tenant.sql`
  - [x] 2.1 Write Section 1: `profiles` table, indexes, and RLS policies
    - Create the `profiles` table with all columns specified in Requirements 1.1: `id` (UUID PK references `auth.users`), `username` (text unique not null), `name`, `short_name`, `role`, `university`, `location`, `email`, `description`, `social_*` fields, URL fields, `created_at`, `updated_at`
    - Add `create unique index if not exists profiles_username_idx` and `create index if not exists profiles_id_idx`
    - Enable RLS; add policies: anon `select using (true)`, auth select/insert/update scoped to `auth.uid() = id`
    - Use `create table if not exists` and `create policy if not exists` guards throughout
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 2.2 Write Section 2: `site_settings` → `profiles` data migration (idempotent `DO` block)
    - Wrap in `DO $$...$$` block; only runs when `profiles` is empty
    - `raise exception` immediately if `site_settings` row `id=1` does not exist (per Requirements 1.4)
    - Insert from `site_settings` using the first `auth.users` row as `profiles.id`, with username `'dimasyudhana'`; use `on conflict (id) do nothing`
    - Do NOT drop `site_settings` (per Requirements 1.5)
    - _Requirements: 1.4, 1.5, 9.2_
  - [x] 2.3 Write Section 3: add `user_id` to content tables and backfill
    - `alter table ... add column if not exists user_id uuid references public.profiles(id) on delete cascade` on `projects`, `testimonials`, `about_scenes`
    - Backfill `user_id` on all three tables with `(select id from public.profiles order by created_at asc limit 1) where user_id is null`
    - Drop and recreate RLS policies on `projects`, `testimonials`, `about_scenes`: anon reads `published = true` rows; auth reads/writes own rows (`user_id = (select id from profiles where id = auth.uid())`)
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 2.4 Write Section 4: `blogs` table, indexes, and RLS policies
    - Create `blogs` table with all columns from Requirements 2.4: `id` (UUID PK default `gen_random_uuid()`), `user_id`, `slug`, `title`, `summary`, `content`, `cover_url`, `published`, `published_at`, `created_at`, `updated_at`; unique constraint on `(user_id, slug)`
    - Create indexes: `blogs_user_published_idx on (user_id, published, published_at desc)` and `blogs_slug_idx on (slug)`
    - Enable RLS; anon reads `published = true`; auth reads/writes own rows
    - _Requirements: 2.4, 2.5, 2.6_
  - [x] 2.5 Write Section 5: `handle_new_user` auth trigger
    - Create or replace function `public.handle_new_user()` as `security definer` with `set search_path = public`
    - Read `username` and `name` from `new.raw_user_meta_data`; fall back email left-part when username is null/empty
    - Loop with 4-digit numeric suffix (`_1000`, `_1001`, …) until `v_candidate` is unique in `profiles`
    - `insert into profiles (id, username, name) values (new.id, v_candidate, v_name) on conflict (id) do nothing`
    - Drop and recreate trigger `on_auth_user_created after insert on auth.users for each row`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 2.6 Write Section 6: `casbin_rule` table and seed data
    - Create `casbin_rule` table: `id serial primary key`, `ptype text`, `v0`–`v5 text`
    - Seed `p` rows for roles `admin` (dashboard/projects/blog/settings) and `editor` (dashboard/projects/blog); seed `g` rows assigning `dimas → admin` and `yudhana → editor`; use `on conflict do nothing`
    - _Requirements: 4.1, 4.2_
  - [x] 2.7 Write Section 7: Storage RLS — per-user path isolation
    - Drop then recreate `media_auth_insert`, `media_auth_update`, `media_auth_delete` policies on `storage.objects`
    - Each policy checks `bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text`
    - Retain existing anon public-read policy unchanged
    - _Requirements: 8.2, 8.3_

- [x] 3. Domain types — extend `src/lib/types.ts`
  - [x] 3.1 Add `Profile` interface to `src/lib/types.ts`
    - Append the `Profile` interface exactly as specified in the design: `id`, `username`, `name`, `shortName`, `role`, `university`, `location`, `email`, `description`, `social` (nested object with `github`/`linkedin`/`facebook`/`instagram`), `heroBackURL`, `heroFrontURL`, `heroMobileURL`, `aboutImageURL`, `cvURL`, `createdAt`, `updatedAt`
    - _Requirements: 6.9_
  - [x] 3.2 Add `BlogPost` interface to `src/lib/types.ts`
    - Append the `BlogPost` interface: `id`, `userId`, `slug`, `title`, `summary`, `content` (Markdown), `coverUrl`, `published`, `publishedAt`, `createdAt`, `updatedAt`
    - _Requirements: 6.10_

- [x] 4. Data layer — create `src/lib/queries-by-user.ts`
  - [x] 4.1 Define `ProfileRow` interface and `mapProfileRow()` mapper
    - Define `ProfileRow` with all snake_case DB column names matching the `profiles` table schema
    - Implement `mapProfileRow(r: ProfileRow): Profile` converting every snake_case field to camelCase — no field dropped, no default substituted when a value is present
    - Export both
    - _Requirements: 6.9_
  - [x] 4.2 Define `BlogPostRow` interface and `mapBlogPostRow()` mapper
    - Define `BlogPostRow` with snake_case DB columns matching the `blogs` table schema
    - Implement `mapBlogPostRow(r: BlogPostRow): BlogPost`
    - Export both
    - _Requirements: 6.10_
  - [x] 4.3 Implement `getProfileByUsername` and `getProjectsByUsername`
    - Add anon client helper (same pattern as `queries.ts`: `createSupabaseClient` with `persistSession: false`)
    - Implement `getProfileByUsername(username: string): Promise<Profile | null>` — single `profiles` lookup by `username`, wrapped in `React.cache()`, returns `null` on error or no row
    - Implement `getProjectsByUsername(username: string): Promise<Project[]>` — join `profiles` on `username`, filter `published = true`, order `sort_order asc, year desc`, wrapped in `React.cache()`, returns `[]` on error
    - Both functions return the safe fallback when `!isSupabaseConfigured`
    - _Requirements: 6.1, 6.2, 6.7, 6.8_
  - [x] 4.4 Implement `getTestimonialsByUsername` and `getAboutScenesByUsername`
    - `getTestimonialsByUsername(username: string): Promise<Testimonial[]>` — join profiles, filter `published = true`, order `sort_order asc`
    - `getAboutScenesByUsername(username: string): Promise<AboutScene[]>` — join profiles, order `scene_order asc`
    - Both wrapped in `React.cache()`, return `[]` on error or when not configured
    - _Requirements: 6.3, 6.4, 6.7, 6.8_
  - [x] 4.5 Implement `getBlogsByUsername` and `getBlogByUsernameAndSlug`
    - `getBlogsByUsername(username: string): Promise<BlogPost[]>` — join profiles, filter `published = true`, order `published_at desc`
    - `getBlogByUsernameAndSlug(username: string, slug: string): Promise<BlogPost | null>` — join profiles + filter on `slug` and `published = true`
    - Both wrapped in `React.cache()`, return `[]` / `null` on error or when not configured
    - _Requirements: 6.5, 6.6, 6.7, 6.8_

- [x] 5. Checkpoint — data layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Casbin RBAC — create `src/lib/casbin/model.conf` and `src/lib/casbin/enforcer.ts`
  - [x] 6.1 Create `src/lib/casbin/model.conf`
    - Write the RBAC model file with exactly the sections from the design: `[request_definition]`, `[policy_definition]`, `[role_definition]`, `[policy_effect]`, `[matchers]`
    - Matcher: `g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act`
    - _Requirements: 4.3_
  - [x] 6.2 Implement `createEnforcerForRequest` in `src/lib/casbin/enforcer.ts`
    - Import `newEnforcer` from `casbin`; load model from `model.conf` path; load policies from `casbin_rule` table via Supabase PostgreSQL adapter using the Supabase connection string
    - Wrap the entire `newEnforcer()` call in `try/catch`; return `null` on any error (DB unreachable, adapter failure, model parse error)
    - The function MUST NOT store the enforcer at module scope — always instantiate fresh per call
    - Export `createEnforcerForRequest(): Promise<Enforcer | null>`
    - _Requirements: 4.4, 4.5, 4.6_
  - [x] 6.3 Implement `getVisibleNavItems` in `src/lib/casbin/enforcer.ts`
    - Export `NavItemKey` type: `"dashboard" | "about" | "projects" | "blog" | "tools" | "testimonials" | "settings"`
    - Implement `getVisibleNavItems(userEmail: string): Promise<NavItemKey[]>`
    - Call `createEnforcerForRequest()`; if `null`, return `["dashboard"]`
    - Iterate all `NavItemKey` values, call `enforcer.enforce(userEmail, item, "read")`, collect allowed items
    - Return allowed items if non-empty, else `["dashboard"]`; wrap entire function in `try/catch` returning `["dashboard"]` on any error
    - _Requirements: 4.6, 11.4_

- [x] 7. NavbarAdmin — update `src/components/Layouts/AdminNavbar/index.tsx`
  - [x] 7.1 Add `key: NavItemKey` field to each entry in the `ITEMS` array
    - Import `NavItemKey` from `src/lib/casbin/enforcer.ts`
    - Extend the `NavItem` interface with `key?: NavItemKey` (optional to allow the `About` group item)
    - Add `key` values to all leaf items: `dashboard`, `about`, `projects`, `blog`, `tools`, `testimonials`, `settings`
    - _Requirements: 7.2_
  - [x] 7.2 Add `visibleItems: NavItemKey[]` prop and filter the rendered list
    - Add `NavbarAdminProps` interface with `visibleItems: NavItemKey[]`
    - Update `NavbarAdmin` signature to accept the prop
    - Filter `ITEMS` before mapping: include an item if its `key` is in `visibleItems`; for group items (e.g. `About`), include the group if its `key` is in `visibleItems`
    - Existing active-state and `NavGroup` logic is unchanged
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 8. Admin layout — update `src/app/admin/layout.tsx`
  - [x] 8.1 Call `getVisibleNavItems` and pass result to `NavbarAdmin`
    - Import `getVisibleNavItems` from `src/lib/casbin/enforcer.ts`
    - After `supabase.auth.getUser()`, call `getVisibleNavItems(user.email)` to get `visibleItems`
    - Pass `visibleItems` as a prop to `<NavbarAdmin visibleItems={visibleItems} />`
    - The call must happen inside the Server Component before children render (per Requirements 11.1)
    - If `user.email` is undefined, call `getVisibleNavItems("")` so the enforcer returns `["dashboard"]`
    - _Requirements: 7.1, 7.8, 7.9, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 9. Admin settings — update `src/lib/admin/queries.ts`
  - [x] 9.1 Update `getSettingsForAdmin` to read from `profiles`
    - Import `Profile` from `src/lib/types.ts`; import `mapProfileRow` from `src/lib/queries-by-user.ts`
    - Rewrite `getSettingsForAdmin()` to read from `profiles` using the authenticated user's `auth.uid()` as the `id` filter
    - Map the returned row to `SiteSettings` shape (map overlapping fields; set `homeShowTools: true`, `homeShowBlog: true`, `stats: defaultStats` for fields that don't exist on `profiles`)
    - Retain the `defaultSettings` fallback for when no row is found
    - _Requirements: 9.3_

- [x] 10. Storage path — update `src/lib/admin/upload.ts`
  - [x] 10.1 Change `uploadFile` signature and path construction
    - Change the second parameter from `folder: string` to `userId: string`
    - Replace `const path = \`${folder}/${crypto.randomUUID()}.${ext}\`` with `const path = \`${userId}/${crypto.randomUUID()}.${ext}\``
    - Do not change any other logic (bucket name, error handling, public URL retrieval remain identical)
    - Update all callers of `uploadFile` in the admin codebase to pass `userId` instead of `folder`
    - _Requirements: 8.1, 8.4_

- [x] 11. Checkpoint — admin layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Portfolio routes — create `src/app/(portfolio)/[username]/` pages
  - [x] 12.1 Create the route group directory and tenant home page `src/app/(portfolio)/[username]/page.tsx`
    - Export `revalidate = 60` and `dynamic = "force-static"` (ISR)
    - Call `getProfileByUsername(username)`; call `notFound()` if `null`
    - Call `getProjectsByUsername(username)` for published projects
    - Export `generateMetadata`: title `{profile.name} – {profile.role}`, `openGraph.url` = `{siteUrl}/{username}`, `alternates.canonical` = fully qualified URL
    - Render a hero/home page using the profile and projects data; reuse existing `HeroSection`, `HeroOverlay`, or similar components where appropriate
    - _Requirements: 5.1, 5.6, 5.8, 5.9, 5.10, 10.1, 10.3_
  - [x] 12.2 Create `src/app/(portfolio)/[username]/about/page.tsx`
    - Export `revalidate = 60`
    - Fetch `getProfileByUsername`, `getAboutScenesByUsername` — call `notFound()` if profile is `null`
    - Export `generateMetadata` with `title`, `openGraph`, `alternates.canonical` populated from profile
    - Render the about page using `ScrollyTelling` and `AboutScene` components (same pattern as `src/app/about/page.tsx`)
    - _Requirements: 5.2, 5.6, 5.8, 5.9_
  - [x] 12.3 Create `src/app/(portfolio)/[username]/contact/page.tsx`
    - Export `revalidate = 60`
    - Fetch `getProfileByUsername` — call `notFound()` if `null`
    - Export `generateMetadata` with profile-derived title and OpenGraph fields
    - Render the contact page with profile email, socials, and the existing `ContactForm` component
    - _Requirements: 5.3, 5.6, 5.8, 5.9_
  - [x] 12.4 Create `src/app/(portfolio)/[username]/blog/page.tsx`
    - Export `revalidate = 60`
    - Fetch `getProfileByUsername` and `getBlogsByUsername` (ordered by `published_at desc`) — call `notFound()` if profile is `null`
    - Export `generateMetadata` with profile-derived title and OpenGraph fields
    - Render a blog index listing all published blog posts
    - _Requirements: 5.4, 5.6, 5.8, 5.9_
  - [x] 12.5 Create `src/app/(portfolio)/[username]/blog/[slug]/page.tsx`
    - Export `revalidate = 60`
    - Fetch `getProfileByUsername` then `getBlogByUsernameAndSlug(username, slug)` — call `notFound()` if either is `null`
    - Export `generateMetadata`: title `{post.title} – {profile.name}`, `openGraph.description` from `post.summary`, `alternates.canonical`
    - Render the blog post with Markdown content (use `react-markdown` + `remark-gfm` + `rehype-highlight` as used elsewhere in the codebase)
    - _Requirements: 5.5, 5.7, 5.8, 5.9, 10.2, 10.3_

- [ ] 13. Checkpoint — portfolio routes complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Property-based tests — create test files using fast-check
  - [ ] 14.1 Write property test for Property 1: row mapper field preservation
    - File: `src/lib/queries-by-user.test.ts`
    - Use `fc.record()` to generate arbitrary `ProfileRow` objects; assert all camelCase fields on the returned `Profile` exactly equal the corresponding snake_case source fields; `numRuns: 100`
    - **Property 1: Row mapper field preservation**
    - **Validates: Requirements 6.9, 6.10**
    - _Requirements: 6.9, 6.10_
  - [ ]* 14.2 Write property test for Property 2: query functions never throw
    - File: `src/lib/queries-by-user.test.ts`
    - Mock the anon Supabase client's `.from()` to throw; call all six query functions with arbitrary username/slug strings; assert each returns `null` or `[]` and does not throw
    - **Property 2: Username-scoped query functions never throw**
    - **Validates: Requirements 6.8**
    - _Requirements: 6.8_
  - [ ]* 14.3 Write property test for Property 3: username query isolation
    - File: `src/lib/queries-by-user.test.ts`
    - Generate two distinct `ProfileRow` objects and associated project rows; mock the anon client to filter by `user_id`; call `getProjectsByUsername(A.username)` and verify no result has `user_id === B.id`
    - **Property 3: Username query returns exactly the requested user's data**
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.5**
    - _Requirements: 6.2, 6.3, 6.4, 6.5_
  - [ ]* 14.4 Write property test for Property 4: `getProfileByUsername` round-trip
    - File: `src/lib/queries-by-user.test.ts`
    - For any `ProfileRow`, mock DB to return it; call `getProfileByUsername(row.username)`; assert `result.username === row.username && result.id === row.id`
    - **Property 4: getProfileByUsername round-trip**
    - **Validates: Requirements 6.1**
    - _Requirements: 6.1_
  - [ ]* 14.5 Write property test for Property 5: tenant metadata isolation
    - File: `src/app/(portfolio)/[username]/page.test.tsx`
    - Generate two arbitrary `Profile` objects with distinct usernames; mock `getProfileByUsername`; call `generateMetadata` with each; assert A's metadata contains `A.name`/`A.username` and does not contain `B.name`/`B.username`
    - **Property 5: Tenant metadata isolation**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.5**
    - _Requirements: 10.1, 10.2, 10.3, 10.5_
  - [ ]* 14.6 Write property test for Property 6: missing username produces empty metadata
    - File: `src/app/(portfolio)/[username]/page.test.tsx`
    - For any username string not in the mocked profiles set, mock `getProfileByUsername` to return `null`; verify `generateMetadata` calls `notFound()` and returns no `title`, `openGraph`, or `alternates.canonical`
    - **Property 6: Missing username produces empty metadata**
    - **Validates: Requirements 10.4, 5.6**
    - _Requirements: 10.4, 5.6_
  - [ ]* 14.7 Write property test for Property 7: Casbin policy absence defaults to dashboard-only
    - File: `src/lib/casbin/enforcer.test.ts`
    - For any email string `E`, call `getVisibleNavItems(E)` with a mock enforcer backed by an empty policy set; assert result is `["dashboard"]` exactly
    - **Property 7: Casbin policy absence defaults to dashboard-only**
    - **Validates: Requirements 4.6, 11.4**
    - _Requirements: 4.6, 11.4_
  - [ ]* 14.8 Write property test for Property 8: Casbin enforcer respects role inheritance
    - File: `src/lib/casbin/enforcer.test.ts`
    - For any `(user, role, navItem)` triple, build an enforcer with an in-memory adapter seeded with matching `g` and `p` rules; assert `enforce(user, navItem, "read")` returns `true`; assert it returns `false` when no chain exists
    - **Property 8: Casbin enforcer respects role inheritance**
    - **Validates: Requirements 4.3, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7**
    - _Requirements: 4.3, 7.1–7.7_
  - [ ]* 14.9 Write property test for Property 9: NavbarAdmin renders exactly permitted items
    - File: `src/components/Layouts/AdminNavbar/NavbarAdmin.test.tsx`
    - For any subset of `NavItemKey` values, render `<NavbarAdmin visibleItems={subset} />`; assert rendered link count equals `subset.length`; assert each link's `href` matches the expected path
    - **Property 9: NavbarAdmin renders exactly the permitted items**
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.5, 7.6, 7.7**
    - _Requirements: 7.2–7.7_
  - [ ]* 14.10 Write property test for Property 10: upload path scoped to user ID
    - File: `src/lib/admin/upload.test.ts`
    - For any `userId` UUID string and any `File` mock, spy on `supabase.storage.upload`; call `uploadFile(file, userId)`; assert the captured path starts with `userId + "/"`; assert it never uses a different prefix
    - **Property 10: Upload path scoped to user ID**
    - **Validates: Requirements 8.1, 8.4**
    - _Requirements: 8.1, 8.4_
  - [ ]* 14.11 Write property test for Property 11: RLS content isolation
    - File: `src/__tests__/rls-isolation.test.ts`
    - Integration test against a local Supabase test instance; for two test users A and B, verify A's client cannot update a row where `user_id = B.id` (expect RLS violation)
    - **Property 11: RLS content isolation — auth user sees only own rows**
    - **Validates: Requirements 2.3, 2.6, 8.2**
    - _Requirements: 2.3, 2.6, 8.2_
  - [ ]* 14.12 Write property test for Property 12: migration idempotency
    - File: `src/__tests__/migration.test.ts`
    - Apply `0005_multi_tenant.sql` twice against a test DB; assert row counts in `profiles`, `casbin_rule`, `projects`, `testimonials`, `about_scenes` are identical after each application and no errors are raised
    - **Property 12: Migration idempotency**
    - **Validates: Requirements 9.1**
    - _Requirements: 9.1_
  - [ ]* 14.13 Write property test for Property 13: auth trigger username derivation
    - File: `src/__tests__/auth-trigger.test.ts`
    - For any email string `local@domain` with no username metadata, insert a test auth user; assert `profiles.username === local`
    - **Property 13: Auth trigger username derivation**
    - **Validates: Requirements 3.1, 3.3**
    - _Requirements: 3.1, 3.3_
  - [ ]* 14.14 Write property test for Property 14: auth trigger uniqueness collision resolution
    - File: `src/__tests__/auth-trigger.test.ts`
    - Pre-insert a profile with username `U`; insert a second auth user with username metadata `U`; assert the second `profiles.username` starts with `U` and is not equal to `U`; assert no conflict with any existing profile
    - **Property 14: Auth trigger uniqueness collision resolution**
    - **Validates: Requirements 3.4**
    - _Requirements: 3.4_

- [ ] 15. Verification — typecheck, lint, and test
  - [ ] 15.1 Run TypeScript type checking
    - Run `npm run typecheck` (`tsc --noEmit`); fix any type errors introduced by new files and modified interfaces
    - Ensure `Profile`, `BlogPost`, `NavItemKey`, and `NavbarAdminProps` are correctly exported and consumed
    - _Requirements: (all)_
  - [ ]* 15.2 Run linter
    - Run `npm run lint` (`eslint`); fix any lint errors in new and modified files
    - _Requirements: (all)_
  - [ ]* 15.3 Run test suite
    - Run `npm run test` (`vitest run`); all property tests and unit tests must pass
    - _Requirements: (all)_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Tasks 2.1–2.7 all write to the single file `supabase/migrations/0005_multi_tenant.sql` — they must be executed sequentially within their wave
- Tasks 14.11–14.14 are integration tests that require a local Supabase test instance; they may be skipped if no local DB is available
- The `(portfolio)` route group folder name is parenthesised — Next.js App Router treats it as invisible to the URL, so `/[username]` is served without any `(portfolio)` prefix
- All query functions in `queries-by-user.ts` must follow the existing pattern from `queries.ts`: `React.cache()`, no throw, `isSupabaseConfigured` guard, safe fallback
- `NavbarAdmin` is a `"use client"` component — `NavItemKey` imported from the enforcer must only reference the type, not execute server-only code at the import site; use `import type` or ensure the type is re-exported from a shared types file if needed
- The `casbin` package provides a PostgreSQL adapter; consult `node_modules/casbin/` docs for the exact adapter import path before writing `enforcer.ts`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1", "3.2"] },
    { "id": 2, "tasks": ["2.2", "4.1", "4.2"] },
    { "id": 3, "tasks": ["2.3", "4.3", "4.4", "4.5"] },
    { "id": 4, "tasks": ["2.4"] },
    { "id": 5, "tasks": ["2.5", "6.1"] },
    { "id": 6, "tasks": ["2.6", "6.2"] },
    { "id": 7, "tasks": ["2.7", "6.3"] },
    { "id": 8, "tasks": ["7.1", "9.1", "10.1"] },
    { "id": 9, "tasks": ["7.2"] },
    { "id": 10, "tasks": ["8.1"] },
    { "id": 11, "tasks": ["12.1", "12.2", "12.3", "12.4"] },
    { "id": 12, "tasks": ["12.5"] },
    { "id": 13, "tasks": ["14.1", "14.2", "14.3", "14.4", "14.10"] },
    { "id": 14, "tasks": ["14.5", "14.6", "14.7", "14.8", "14.9"] },
    { "id": 15, "tasks": ["14.11", "14.12", "14.13", "14.14"] },
    { "id": 16, "tasks": ["15.1"] },
    { "id": 17, "tasks": ["15.2", "15.3"] }
  ]
}
```
