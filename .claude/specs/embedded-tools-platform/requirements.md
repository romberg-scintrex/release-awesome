# Requirements — Embedded Tools Platform

> ## ⚠️ Needs re-baseline — the ownership question is now answered
>
> This spec assumes `tools` is a single-owner table. **It is not, on branch
> `0010`.** Verified in `0005_multi_tenant.sql` (lines 345–403): `tools` already
> has `user_id`, a `tools_user_published_idx` index, and the same four per-tenant
> RLS policies as `projects` and `blogs`.
>
> So `tools` is **per-tenant**, and this spec's routing changes accordingly:
>
> | Was assumed | Actual |
> |-------------|--------|
> | `/tools` at the root, single-owner | **`/:username/tools`**, scoped by `user_id` |
> | `/tools` becomes a reserved username | no new reserved word needed |
> | One tool catalogue for the site | each tenant curates their own rows |
>
> **What changes:** Requirement 3 (public routes) moves under the
> `(portfolio)/[username]` route group and reads through
> `getToolsByUsername()` — which already exists in `queries-by-user.ts` on
> `0010` — instead of `getTools()`. Requirement 6 keeps its dependency-hygiene
> scope unchanged.
>
> **What survives untouched:** the CSP analysis and the resulting deferral of
> `ocr` and `background-remover` (design D1), the `useWebWorker: false`
> constraint (D2), the static import map (D3), the registry-completeness test
> (D4), and all nine light tools. That is most of the spec, and none of it
> depends on ownership.
>
> **What survives either way:** the CSP analysis and the resulting deferral of
> `ocr` and `background-remover` (design D1), the `useWebWorker: false`
> constraint (D2), the static import map (D3), the registry-completeness test
> (D4), and all nine light tools. That is most of the spec's value and none of
> it depends on the ownership question.
>
> Details: [specs/README.md](../README.md#embedded-tools-platform).


## Introduction

`src/lib/tools/registry.ts` declares 11 embedded tool components and documents a
three-step process for adding more, step 2 of which says *"register the component
in `src/components/tools/ToolEmbed.tsx`"*. **`src/components/tools/` does not
exist.** A `Tool` row with `kind: "embedded"` therefore stores a `component_key`
that resolves to nothing, and `ToolForm`'s component dropdown offers 11 choices
that all render blank.

There is also no public surface. `getToolBySlug()` and `getFeaturedTools()` are
unreferenced; the only consumer of `getTools()` is `MarqueeTech` on `/`, which
uses tool rows as tech-stack marquee icons. No `/tools` route exists.

Seven dependencies are installed solely for these tools and currently ship
nothing: `@imgly/background-removal`, `tesseract.js`, `qrcode`,
`browser-image-compression`, plus `sql-formatter`, `diff`, and `js-yaml` which
are not even referenced by the registry.

This spec builds the renderer, the public routes, and the tool components —
and resolves the Content-Security-Policy problem that makes two of the eleven
unshippable as designed.

## Baseline assumptions

- Branch `development`, HEAD `efa8456`.
- **Does not depend on the `0010` merge.** `tools` is a single-owner table with
  no `user_id` on either branch.
- Depends on [`admin-content-crud`](../admin-content-crud/requirements.md) only
  for convenience: the tools admin already works, so authoring is possible
  today.
- The CSP in `next.config.ts` is **enforcing**, not report-only. Any tool that
  needs a network fetch to an unlisted origin, or a `blob:` worker, will fail at
  runtime with no build error.

## Glossary

- **Tool_Row**: A row in the `tools` table, mapped to the `Tool` domain type.
- **Tool_Kind**: `"embedded"` or `"external"`.
- **Component_Key**: `Tool.componentKey`, a string naming an embedded
  component. Validated by `isToolComponentKey()` in
  `src/lib/tools/registry.ts`.
- **Registry**: `TOOL_COMPONENTS` in `src/lib/tools/registry.ts` — 11 entries
  of `{ key, label, description }`. Plain metadata, importable from server and
  client.
- **Tool_Embed**: The component that maps a Component_Key to a lazily loaded
  React component.
- **Tool_Component**: One embedded tool's implementation, a client component.
- **Tools_Index**: The public route listing published tools.
- **Tool_Detail**: The public route rendering one tool.
- **CSP**: The enforcing Content-Security-Policy in `next.config.ts`.
- **Light_Tool**: A Tool_Component that needs no network fetch beyond the page
  bundle, no WebAssembly asset download, and no worker.
- **Heavy_Tool**: A Tool_Component requiring a downloaded WASM runtime, a model
  file, or a worker. Exactly two: `ocr` and `background-remover`.

---

## Requirements

### Requirement 1: Registry integrity

**User Story:** As a maintainer, I want the registry and the implementations to
be impossible to drift apart, so the admin dropdown never offers a broken
choice.

#### Acceptance Criteria

1. THE Tool_Embed SHALL expose a mapping whose keys are exactly the `key`
   values of the Registry.
2. THE implementation SHALL include a test asserting that every Registry `key`
   has a Tool_Embed entry and every Tool_Embed entry has a Registry `key`, so
   the two cannot diverge without a failing test.
3. WHEN a Component_Key is not in the mapping THEN the Tool_Embed SHALL render
   a visible "tool unavailable" state and SHALL NOT throw.
4. THE Registry header comment SHALL be updated to describe the file paths that
   actually exist once this spec completes.
5. THE `isToolComponentKey()` helper SHALL be used to validate `component_key`
   before render, and SHALL NOT be bypassed.
6. IF a Tool_Component is deferred rather than implemented THEN its Registry
   entry SHALL be removed, so the admin dropdown offers only working choices.

---

### Requirement 2: Tool embed renderer

**User Story:** As a visitor, I want an embedded tool to load only when I open
it, so that browsing the tool list is cheap.

#### Acceptance Criteria

1. THE Tool_Embed SHALL load each Tool_Component with `next/dynamic` so that no
   tool's code is in the initial bundle of any route.
2. THE Tool_Embed SHALL be a Client Component, because `ssr: false` with
   `next/dynamic` is a hard error in a Server Component in Next.js 16.
3. THE Tool_Embed SHALL render a loading placeholder occupying a stable layout
   box while a Tool_Component loads.
4. WHEN a Tool_Component's dynamic import fails THEN the Tool_Embed SHALL
   render an error state naming the tool and SHALL NOT crash the page.
5. THE Tool_Embed SHALL wrap each Tool_Component in an error boundary, so a
   runtime fault inside a tool does not blank the route.
6. THE Tool_Embed mapping SHALL be a static object literal of
   `() => import(...)` thunks, not a dynamic template-string import, so the
   bundler can statically enumerate the chunks.

---

### Requirement 3: Public routes — per tenant

**User Story:** As a visitor to someone's portfolio, I want to browse and use
the tools they publish, because none of them is reachable today.

> **Re-baselined 2026-11-01 from `/tools` to `/:username/tools`.** `tools` is a
> per-tenant table: `0005` gives it `user_id`, a `tools_user_published_idx`
> index, the same four RLS policies as `projects`, and a
> `tools_user_slug_unique` constraint on `(user_id, slug)`.
>
> Two consequences worth stating, because both remove work rather than adding
> it:
>
> - **`tools` does not become a reserved username.** The route lives under the
>   tenant segment, so `ROOT_STATIC_SEGMENTS` is untouched.
> - **`getToolsByUsername()` already exists** in `queries-by-user.ts`, already
>   filters `user_id` and `published`, and already resolves through
>   `getProfileByUsername` — which carries the approval gate, so an unapproved
>   tenant's tools are hidden without any extra check.

#### Acceptance Criteria

1. THE Tools_Index SHALL be served at `/:username/tools`, listing every
   Tool_Row belonging to that tenant where `published = true`, ordered by
   `sort_order` ascending, via `getToolsByUsername()`.
2. THE Tool_Detail SHALL be served at `/:username/tools/[slug]`.
3. THE Admin_Panel SHALL gain a new read, `getToolByUsernameAndSlug()`, since
   the slug is unique only within one tenant and the existing
   `getToolBySlug()` is a single-owner lookup that would resolve another
   tenant's tool.
4. WHEN the username does not resolve, is unapproved, or the slug does not
   match one of that tenant's published tools THEN the page SHALL call
   `notFound()`.
5. WHEN a Tool_Row has `kind: "external"` THEN the Tools_Index entry SHALL
   link directly to `externalUrl` with `rel="noopener noreferrer"` and SHALL
   NOT create a Tool_Detail page for it.
6. WHEN a Tool_Row has `kind: "embedded"` THEN the Tool_Detail SHALL render the
   Tool_Embed for its Component_Key.
7. THE Tools_Index and Tool_Detail SHALL declare
   `export const revalidate = 60`, consistent with the other tenant routes.
8. THE Tool_Detail SHALL export `generateMetadata` producing a title and
   description from the Tool_Row and the tenant's `Profile`, with
   `alternates.canonical` for its own path. Metadata SHALL NOT be shared
   between tenants.
9. `params` is a `Promise` and SHALL be awaited — Next.js 16 removed
   synchronous access.
10. THERE SHALL BE no `generateStaticParams`. Enumerating tenant × slug at
    build time would require reading every tenant's tools, and the route is
    already ISR; the other tenant sub-routes do not do it either.
11. WHEN Supabase is unconfigured THEN `/:username/tools` SHALL render an empty
    state, because `getToolsByUsername()` returns `[]` with no seed fallback.
12. THE tenant `Navbar` SHALL gain a `Tools` entry, pointing at
    `${basePath}/tools`. THE platform navbar at the root SHALL NOT, since the
    root has no tools of its own.
13. THE `CommandPalette` entry SHALL be added only if it can be made
    tenant-aware; it builds absolute hrefs today and has no username.

---


### Requirement 4: Light tools

**User Story:** As a visitor, I want the simple utilities to work entirely in my
browser, with nothing sent to a server.

#### Acceptance Criteria

1. THE implementation SHALL deliver these nine Light_Tools:
   `json-formatter`, `jwt-decoder`, `base64`, `hash-generator`, `url-encoder`,
   `qr-code-generator`, `image-compressor`, `image-converter`, `image-resizer`.
2. EVERY Light_Tool SHALL perform all processing in the browser and SHALL NOT
   transmit user input to any server.
3. EVERY Light_Tool SHALL require no network fetch beyond its own JavaScript
   chunk, so the enforcing CSP needs no change.
4. `json-formatter` SHALL pretty-print, minify, and validate, reporting the
   position of a syntax error.
5. `jwt-decoder` SHALL decode header and payload, SHALL NOT verify the
   signature, and SHALL state that it does not verify.
6. `base64` SHALL encode and decode UTF-8 safely, including multi-byte
   characters.
7. `hash-generator` SHALL compute SHA-1, SHA-256, SHA-384, and SHA-512 via the
   Web Crypto API. IF `crypto.subtle` is unavailable — a non-secure context —
   THEN it SHALL say so rather than fail silently.
8. `url-encoder` SHALL percent-encode and decode, and SHALL distinguish
   component encoding from full-URI encoding.
9. `qr-code-generator` SHALL generate a QR code with adjustable error
   correction and SHALL download as both PNG and SVG.
10. `image-compressor`, `image-converter`, and `image-resizer` SHALL accept a
    local file, process it in the browser, preview the result, and offer a
    download.
11. `image-compressor` SHALL configure `browser-image-compression` with
    `useWebWorker: false`, because the CSP forbids `blob:` workers.
12. `image-resizer` SHALL offer an aspect-ratio lock.
13. `image-converter` SHALL convert between PNG, JPEG, and WebP.
14. EVERY Light_Tool SHALL handle an empty or malformed input with an inline
    message and SHALL NOT throw.
15. EVERY Light_Tool SHALL be keyboard-operable and SHALL label every control.

---

### Requirement 5: Heavy tools and the CSP

**User Story:** As a maintainer, I want the two heavy tools either shipped
correctly or removed cleanly, not left broken in the dropdown.

#### Acceptance Criteria

1. THE design document SHALL state, for each of `ocr` and
   `background-remover`, whether it is implemented in this spec or deferred.
2. IF a Heavy_Tool is implemented THEN its WASM runtime, model files, and
   language data SHALL be served from an origin already permitted by the CSP
   `connect-src` directive — `'self'` or `*.supabase.co` — and SHALL NOT be
   fetched from a third-party CDN.
3. IF a Heavy_Tool requires a worker THEN the implementation SHALL either run
   it without a worker, or add a `worker-src` directive to the CSP. **The
   current policy has no `worker-src`, so it falls back to
   `default-src 'self'` and a `blob:` worker is blocked.**
4. IF the CSP is modified THEN a new ADR SHALL be added superseding or
   amending [ADR-010](../../steering/decisions.md#adr-010--enforcing-csp-with-unsafe-inline-and-unsafe-eval),
   recording exactly which directive changed and why.
5. IF a Heavy_Tool is deferred THEN its Registry entry SHALL be removed per
   Requirement 1.6, and its dependency SHALL be removed from `package.json`.
6. IF a Heavy_Tool is implemented THEN its asset download SHALL NOT begin until
   the user explicitly starts the operation, and the UI SHALL state the download
   size before starting.
7. THE total JavaScript added to the `/tools` index route SHALL be at most
   **60 KB gzipped**, since no Tool_Component belongs in that route's bundle.

---

### Requirement 6: Dependency hygiene

**User Story:** As a maintainer, I want no dependency installed for a feature
that does not exist.

#### Acceptance Criteria

1. WHEN this spec completes THEN every one of `@imgly/background-removal`,
   `tesseract.js`, `qrcode`, and `browser-image-compression` SHALL either be
   imported by a shipped Tool_Component or removed from `package.json`.
2. `sql-formatter`, `diff`, and `js-yaml` are referenced by **no** Registry
   entry and no source file. THE implementation SHALL either add Registry
   entries and Tool_Components for them, or remove all three from
   `package.json`.
3. `@faker-js/faker`, `bcryptjs`, `cron-parser`, and `cronstrue` are likewise
   unreferenced. THE implementation SHALL record a decision for each in
   `tasks.md` — keep with a named purpose, or remove.
4. THE `package-lock.json` SHALL be committed alongside any `package.json`
   change.

---

### Requirement 7: Verification

**User Story:** As a reviewer, I want each tool proven to work and the bundle
proven not to regress.

#### Acceptance Criteria

1. THE implementation SHALL include the registry-completeness test from
   Requirement 1.2.
2. THE implementation SHALL include a test per Light_Tool covering one valid
   input and one malformed input, asserting no throw in either case.
3. THE implementation SHALL include a test asserting that an unknown
   Component_Key renders the unavailable state.
4. THE implementation SHALL record the measured `/tools` route JavaScript size
   against the 60 KB budget in `tasks.md`.
5. THE implementation SHALL verify in a real browser, with the enforcing CSP
   active, that no tool produces a CSP violation in the console. A tool that
   works in `next dev` but violates CSP in a production build fails this
   criterion.
6. WHEN `npm run typecheck`, `npm run lint`, `npm run test`, and
   `npm run build` are run THEN each SHALL exit zero.
