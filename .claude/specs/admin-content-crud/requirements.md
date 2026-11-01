# Requirements — Admin Content CRUD

> ## ⚠️ Needs re-baseline before implementation
>
> This spec was written against the single-tenant `development` baseline. The
> product is a **multi-tenant platform** and `feature/release-awesome/0010` is a
> prerequisite, not an alternative. See
> [product.md](../../steering/product.md).
>
> **What changes:**
> - Requirement 4 (settings) becomes a **profile editor** — the signed-in
>   tenant's `profiles` row, not the `site_settings` singleton. Branch `0010`
>   already ships `updateSettings` and an `AdminSettings` component; reuse them.
> - Requirement 3 (blog) must target the per-tenant **`blogs`** table, unique on
>   `(user_id, slug)`, not the single-owner `posts` table.
> - Every list read in Requirements 2.1 and 3.1 must be scoped to the signed-in
>   tenant by `user_id`. An unscoped admin list shows every tenant's content.
> - `reorderEntities` updates `sort_order` by id with **no ownership check**.
>   RLS should block cross-tenant writes, but the action does not verify, so
>   correctness rests entirely on the policy. Add an explicit `user_id` filter.
>
> **What survives unchanged:** Requirement 1 (the published-only testimonials
> read, [G10](../../steering/current-state.md#g1--apinotify-does-not-exist))
> and Requirement 5 (shared behaviour across surfaces). Requirement 1 is a
> two-line fix plus a test and is worth landing on its own, before any
> re-baseline.
>
> ---
>
> **Re-baseline findings, 2026-11-01.** Reading the merged `0010` code turned up
> three things the banner above had only guessed at:
>
> 1. **Requirement 4 is mostly already built, and was broken.** `0010` ships
>    `updateSettings` and an `AdminSettings` component — but `updateSettings`
>    wrote `site_settings` while `getSettingsForAdmin` read `profiles`, so the
>    form never showed what it saved. Fixed; see
>    [G21](../../steering/current-state.md#g2--admin-navbar-links-to-pages-that-do-not-exist---mostly-fixed-2026-11-01).
>    What remains for this spec is the *form*: four `SettingsInput` fields —
>    `url`, `homeShowTools`, `homeShowBlog`, `stat` — have no `profiles` column
>    and must stop being offered.
> 2. **The admin reads leaked across tenants**, and that was worse than the
>    reorder risk this banner flagged. Fixed; see
>    [G20](../../steering/current-state.md#g2--admin-navbar-links-to-pages-that-do-not-exist---mostly-fixed-2026-11-01).
>    Requirement 2.1 and 3.1's "scope by `user_id`" is therefore **done** for
>    the surfaces that already exist, and any new list must follow the same
>    `ownerId()` pattern.
> 3. **`posts` has no `user_id` and `0005` never touched it**, so its reads
>    cannot be owner-scoped at all. That settles Requirement 3: the blog admin
>    must target **`blogs`**, not `posts`. `reorderEntities` already skips the
>    ownership filter for that kind, which is a standing hazard until the
>    switch happens.
>
> Details: [specs/README.md](../README.md#admin-content-crud).


## Introduction

`AdminNavbar` renders six links. Three of them — `/admin/projects`,
`/admin/blog`, `/admin/settings` — have no page and return 404 to a signed-in
administrator. A fourth, `/admin/testimonials`, exists but reads through the
*public* query, so it cannot show the unpublished rows an editor needs to
publish.

Meanwhile the supporting layer is already built: `ProjectInput`, `PostInput`,
and `SettingsInput` exist in `src/lib/admin/types.ts`; `getListProjects`,
`getProjectById`, `getListPosts`, `getPostById`, and `getSettingsForAdmin` exist
in `src/lib/admin/queries.ts`; `reorderEntities` already accepts
`"projects" | "posts" | "tools"` and its `revalidatePosts()` helper already
revalidates `/admin/blog`. The tools module is a complete working reference
implementation.

This spec closes the gap: four admin surfaces, following the tools pattern
exactly, plus the mutation actions each needs.

## Baseline assumptions

- Branch `development`, HEAD `efa8456`.
- **Does not depend on the `0010` merge.** Settings read and write go through
  the `site_settings` singleton, not `profiles`.
- **If `0010` merges first, this spec must be re-baselined** before
  implementation: `site_settings` → `profiles`, every list scoped by `user_id`,
  and the settings page replaced by `0010`'s `AdminSettings` component. Do not
  attempt both shapes at once.
- Admin RBAC is out of scope. There is no Casbin on `development`; every
  signed-in user sees every nav item.

## Glossary

- **Admin_Panel**: The authenticated CMS under `/admin`.
- **Admin_Navbar**: `src/components/Layouts/AdminNavbar/index.tsx`. Renders a
  fixed six-item list; takes no props on this branch.
- **Tools_Pattern**: The existing reference implementation —
  `src/app/admin/tools/{page,new/page,[id]/page}.tsx`,
  `src/components/Fragments/ToolForm/`, `src/components/Fragments/ToolRowActions/`,
  and the `createTool` / `updateTool` / `deleteTool` / `setToolPublished`
  actions in `src/app/admin/action.ts`.
- **Entity_Form**: A `"use client"` form component that takes an optional
  `initial` domain object and calls a create or update action.
- **Row_Actions**: A `"use client"` component giving one list row its
  publish-toggle and delete controls.
- **Reorder_List**: `src/components/Fragments/ReorderableList/index.tsx`. Takes
  `kind: ReorderKind` and `ids: string[]`; children must align by index.
- **Action_Result**: `{ ok: boolean; error?: string }`, the return type of every
  mutation.
- **Require_Admin**: `requireAdmin()` in `src/lib/admin/queries.ts` —
  `auth.getUser()`, never `getSession()`.
- **Settings_Singleton**: The `site_settings` row with `id = 1`.
- **Admin_Read**: A read that must return unpublished rows, performed with the
  cookie-aware server client.
- **Public_Read**: A read in `src/lib/queries.ts` that filters
  `published = true` using the anon client.

---

## Requirements

### Requirement 1: Correct the testimonials admin read

**User Story:** As an editor, I want to see my unpublished testimonials in the
admin list, so that I can review and publish them.

#### Acceptance Criteria

1. THE `/admin/testimonials` page SHALL source its rows from
   `getListTestimonials()` in `src/lib/admin/queries.ts`, not from
   `getTestimonials()` in `src/lib/queries.ts`.
2. THE `/admin/testimonials` page SHALL display rows where `published = false`.
3. THE `/admin/testimonials` page SHALL declare
   `export const dynamic = "force-dynamic"`, consistent with every other admin
   page that reads mutable data.
4. THE `/admin/testimonials` page SHALL indicate each row's published state
   visually, so an editor can tell drafts from live rows at a glance.
5. THE change SHALL be covered by a test asserting that an unpublished
   testimonial appears in the admin list.
6. THE public home page SHALL continue to render only published testimonials.

---

### Requirement 2: Projects admin

**User Story:** As the site owner, I want to manage my portfolio projects from
the admin panel, so that I do not have to edit the database directly.

#### Acceptance Criteria

1. THE Admin_Panel SHALL serve `/admin/projects` listing every project
   **belonging to the signed-in tenant** regardless of `published`, ordered by
   `sort_order` ascending. `getListProjects()` is already owner-scoped — see
   [G20](../../steering/current-state.md#g2--admin-navbar-links-to-pages-that-do-not-exist---mostly-fixed-2026-11-01).
2. THE Admin_Panel SHALL serve `/admin/projects/new` and
   `/admin/projects/[id]`, following the Tools_Pattern route shape.
3. WHEN `/admin/projects/[id]` is requested with an id that does not resolve
   THEN the page SHALL call `notFound()`.
4. THE projects Entity_Form SHALL accept and persist every field of
   `ProjectInput`: `slug`, `title`, `shortDescription`, `longDescription`,
   `categories`, `technologies`, `year`, `featured`, `published`, `gallery`,
   `thumbnailURL`, `liveURL`, `githubURL`, `linkedinURL`, `gradient`,
   `sortOrder`.
5. THE projects Entity_Form SHALL constrain `categories` to the members of
   `PROJECT_CATEGORIES` and SHALL allow more than one.
6. THE projects Entity_Form SHALL allow adding, removing, and reordering
   `gallery` items, each with `type` of `"image"` or `"video"`, a `url`, and an
   optional `caption`.
7. THE projects Entity_Form SHALL derive `slug` from `title` until the slug
   field is edited, matching `ToolForm`'s `slugTouched` behaviour.
8. THE Admin_Panel SHALL provide `createProject`, `updateProject`,
   `deleteProject`, and `setProjectPublished` actions, each returning an
   Action_Result and each calling Require_Admin before touching the database.
   EVERY write SHALL set `user_id` to the signed-in tenant on create and filter
   on `user_id` on update and delete, following the `ownerId()` pattern rather
   than relying on RLS alone.
9. WHEN a project mutation succeeds THEN the action SHALL revalidate `/` and
   `/admin/projects`.
10. THE `/admin/projects` list SHALL support manual reordering via Reorder_List
    with `kind: "projects"`, which `reorderEntities` already supports.
11. IF a `slug` collides with an existing row THEN the action SHALL return
    `{ ok: false, error }` carrying a message that names the conflict, and SHALL
    NOT throw.

---

### Requirement 3: Blog admin

**User Story:** As a tenant, I want to write and publish blog posts, so that my
`/:username/blog` has content.

> **Retargeted 2026-11-01 from `posts` to `blogs`.** `posts` has no `user_id`
> and migration `0005` never touched it, so its reads cannot be owner-scoped at
> all — see [G20](../../steering/current-state.md#g2--admin-navbar-links-to-pages-that-do-not-exist---mostly-fixed-2026-11-01).
> `blogs` is the per-tenant table, unique on `(user_id, slug)`, and it is what
> `/:username/blog` already reads.
>
> **`PostInput` cannot be reused.** `blogs` has **no `tags`, no `featured` and
> no `sort_order`**, and calls the summary field `summary` rather than
> `excerpt`. A `BlogInput` is required, and three criteria from the previous
> draft are gone with those columns — including manual reordering, which is not
> merely unimplemented but impossible.

#### Acceptance Criteria

1. THE Admin_Panel SHALL serve `/admin/blog` listing every row of `blogs`
   belonging to the signed-in tenant, regardless of `published`, ordered by
   `published_at` descending with nulls first, then `created_at` descending.
2. THE Admin_Panel SHALL serve `/admin/blog/new` and `/admin/blog/[id]`.
3. THE Admin_Panel SHALL define a `BlogInput` type carrying exactly the
   columns `blogs` has: `slug`, `title`, `summary`, `content`, `coverUrl`,
   `published`, `publishedAt`.
4. THE blog Entity_Form SHALL accept and persist every field of `BlogInput`.
5. THE blog Entity_Form SHALL edit `content` as Markdown in a plain textarea
   and SHALL offer a rendered preview using the already-installed
   `react-markdown`, `remark-gfm` and `rehype-highlight`.
6. WHEN `published` transitions from `false` to `true` AND `publishedAt` is
   null THEN the action SHALL set `publishedAt` to the current timestamp.
7. WHEN `published` transitions from `true` to `false` THEN the action SHALL
   leave `publishedAt` unchanged, so re-publishing preserves the original date.
8. THE Admin_Panel SHALL provide `createBlog`, `updateBlog`, `deleteBlog` and
   `setBlogPublished`, each returning an Action_Result and each calling
   Require_Admin first.
9. EVERY blog write SHALL set `user_id` to the signed-in tenant on create, and
   SHALL filter on `user_id` on update and delete — not relying on RLS alone,
   for the reason recorded in G20.
10. WHEN a blog mutation succeeds THEN the action SHALL revalidate that
    tenant's `/:username/blog`, `/:username/blog/[slug]` and `/admin/blog`.
    THE existing `revalidatePosts()` helper is **not** reusable: it revalidates
    the owner's root `/blog` paths, which belong to the legacy single-owner
    system.
11. THE unique constraint is `(user_id, slug)`, so a slug only collides within
    one tenant. IF it collides THEN the action SHALL return
    `{ ok: false, error }` naming the conflict, from Postgres code `23505`.
12. THERE SHALL BE no manual reordering of blog posts. `blogs` has no
    `sort_order` column, and `reorderEntities` has no `"blogs"` kind. Ordering
    is by `published_at`, matching what `getBlogsByUsername` serves publicly.
13. THE legacy `posts` table and the root `/blog` routes are **out of scope**.
    They remain as they are, and `reorderEntities`'s `"posts"` kind keeps its
    unscoped behaviour until a later spec retires them.

---

### Requirement 4: Profile editor (was: Settings admin)

**User Story:** As a tenant, I want to edit my own identity and hero imagery,
so that my portfolio reflects me without a deploy.

> **Mostly built already, and it was broken.** `0010` ships
> `/admin/settings`, an `AdminSettings` component and `updateSettings`. But
> `updateSettings` wrote `site_settings` while `getSettingsForAdmin` read
> `profiles`, so the form never showed what it saved — fixed, see
> [G21](../../steering/current-state.md#g2--admin-navbar-links-to-pages-that-do-not-exist---mostly-fixed-2026-11-01).
> What remains for this spec is the **form**.

#### Acceptance Criteria

1. THE Admin_Panel SHALL serve `/admin/settings`, reading the signed-in
   tenant's row via `getSettingsForAdmin()`.
2. THE settings form SHALL accept and persist only the fields `profiles`
   actually has: `name`, `shortName`, `role`, `university`, `location`,
   `email`, `description`, the four `social` fields, `heroBackURL`,
   `heroFrontURL`, `heroMobileURL`, `aboutImageURL`, `cvURL`.
3. THE settings form SHALL NOT offer `url`, `homeShowTools`, `homeShowBlog` or
   `stat`. `profiles` has no such columns and `getSettingsForAdmin` returns
   them hardcoded, so a control for any of them is a field that silently does
   not save.
4. THE form SHALL state that `email` is the **publicly displayed** address, and
   that messages from the contact form go to the account's verified sign-in
   address instead.
5. THE image URL fields SHALL use the existing `MediaUpload` fragment.
6. THE form SHALL NOT offer to edit `username`. Changing it would break every
   published link to the portfolio and collide with the reserved list; it is a
   separate spec if it is ever wanted.
7. THE form SHALL NOT offer to edit `status`. Approval is an operator action
   performed in the Supabase dashboard — [ADR-016](../../steering/decisions.md#adr-016--waitlist-with-manual-approval).
8. `SettingsInput` names its stats field `stat` while `SiteSettings` names it
   `stats`. SINCE neither is persisted any more, THE implementation SHALL
   remove the field from `SettingsInput` rather than reconcile the spelling.
9. WHEN the mutation succeeds THEN `updateSettings` SHALL revalidate that
   tenant's own paths, not the whole site. **Already implemented.**

---


### Requirement 5: Shared behaviour across all four surfaces

**User Story:** As a maintainer, I want the four new surfaces to behave
identically to the existing tools module, so there is one pattern to learn.

#### Acceptance Criteria

1. EVERY new admin page SHALL declare `export const dynamic = "force-dynamic"`.
2. EVERY new mutation SHALL call Require_Admin as its first statement and
   SHALL return `{ ok: false, error: NOT_AUTHORIZED }` when no user is present.
3. EVERY new mutation SHALL return an Action_Result and SHALL NOT throw.
4. EVERY new Admin_Read SHALL use the cookie-aware server client from
   `src/lib/supabase/server.ts` and SHALL NOT filter on `published`.
5. EVERY new write SHALL convert its camelCase input to snake_case columns in a
   dedicated `*ToRow()` helper, mirroring `toolToRow()`.
6. NO new code SHALL re-implement row mapping; `map*Row()` from
   `src/lib/queries.ts` SHALL be reused.
7. EVERY Entity_Form SHALL surface an action's `error` string to the editor and
   SHALL keep the entered values on failure, so nothing is retyped.
8. EVERY Entity_Form SHALL disable its submit control while a mutation is in
   flight.
9. EVERY destructive action SHALL require a confirmation step before firing.
10. EVERY new page SHALL follow the admin visual conventions already in use:
    cards `rounded-2xl border border-black/10 bg-white dark:border-white/10
    dark:bg-ink-900`, inputs `rounded-xl … focus:ring-2 focus:ring-accent/40
    dark:bg-ink-800`.

---

### Requirement 6: Navigation integrity

**User Story:** As a signed-in administrator, I want every navbar link to lead
somewhere, so that the panel is not a set of traps.

#### Acceptance Criteria

1. WHEN this spec completes THEN every link rendered by Admin_Navbar SHALL
   resolve to an existing page.
2. THE Admin_Navbar active-state logic SHALL mark exactly one item active for
   any admin path, including nested paths such as `/admin/projects/new`.
3. THE Admin_Navbar SHALL NOT be given new links for pages that do not exist.
4. IF a surface is deliberately deferred THEN its Admin_Navbar link SHALL be
   removed rather than left pointing at a 404.

---

### Requirement 7: Verification

**User Story:** As a reviewer, I want each surface proven to work end to end.

#### Acceptance Criteria

1. THE implementation SHALL include a test per entity asserting that an
   unpublished row appears in the admin list and does not appear in the
   corresponding Public_Read.
2. THE implementation SHALL include a test per mutation asserting that an
   unauthenticated call returns `{ ok: false, error: NOT_AUTHORIZED }` and
   performs no write.
3. THE implementation SHALL include a test asserting the Requirement 3.5 and
   3.6 `publishedAt` transition rules.
4. THE implementation SHALL include a test asserting that each `*ToRow()`
   helper emits only snake_case keys that exist on its table.
5. WHEN `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`
   are run THEN each SHALL exit zero.
