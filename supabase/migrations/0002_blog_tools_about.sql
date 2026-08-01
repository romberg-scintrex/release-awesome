-- ============================================================================
--  Portfolio — migration 0002
--  Adds: an editable About-page image, a Blog (posts), and Tools
--  (an admin-managed catalog + embedded functional tools).
--  Run in the Supabase SQL editor (or `supabase db push`) AFTER 0001_init.sql.
-- ============================================================================

-- ─────────────────────────────────────────────
--  SITE SETTINGS — dedicated About-page portrait
--  null → falls back to the mobile hero image, then the bundled image.
-- ─────────────────────────────────────────────
alter table public.site_settings
  add column if not exists about_image_url text;

-- ─────────────────────────────────────────────
--  BLOG POSTS
-- ─────────────────────────────────────────────
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  excerpt       text not null default '',
  content       text not null default '',          -- Markdown body
  cover_url     text,
  tags          text[] not null default '{}',
  featured      boolean not null default false,
  published     boolean not null default false,
  published_at  timestamptz,                        -- display + ordering date
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists posts_published_idx on public.posts (published);
create index if not exists posts_order_idx      on public.posts (published_at desc, created_at desc);

-- ─────────────────────────────────────────────
--  TOOLS  (catalog entries + embedded functional tools)
--  kind = 'embedded' → render a built-in component keyed by component_key
--  kind = 'external' → link out to external_url
-- ─────────────────────────────────────────────
create table if not exists public.tools (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  name           text not null,
  tagline        text not null default '',
  description    text not null default '',          -- Markdown shown on the tool page
  category       text not null default 'Utility',
  icon           text,                               -- lucide icon name (card)
  cover_url      text,
  gradient       text not null default 'from-brand-violet via-brand-fuchsia to-brand-rose',
  kind           text not null default 'embedded' check (kind in ('embedded','external')),
  component_key  text,                               -- registry key when kind = 'embedded'
  external_url   text,                               -- link target when kind = 'external'
  featured       boolean not null default false,
  published      boolean not null default false,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists tools_published_idx on public.tools (published);
create index if not exists tools_order_idx      on public.tools (sort_order, created_at desc);

-- ─────────────────────────────────────────────
--  updated_at triggers (reuse public.set_updated_at from 0001)
-- ─────────────────────────────────────────────
drop trigger if exists trg_posts_updated on public.posts;
create trigger trg_posts_updated before update on public.posts
  for each row execute function public.set_updated_at();

drop trigger if exists trg_tools_updated on public.tools;
create trigger trg_tools_updated before update on public.tools
  for each row execute function public.set_updated_at();

-- ============================================================================
--  ROW LEVEL SECURITY — mirror projects: anon reads published, admin reads/writes all.
-- ============================================================================
alter table public.posts enable row level security;
alter table public.tools enable row level security;

-- POSTS
drop policy if exists "posts_select" on public.posts;
drop policy if exists "posts_insert" on public.posts;
drop policy if exists "posts_update" on public.posts;
drop policy if exists "posts_delete" on public.posts;
create policy "posts_select" on public.posts
  for select using (published = true or auth.role() = 'authenticated');
create policy "posts_insert" on public.posts
  for insert to authenticated with check (true);
create policy "posts_update" on public.posts
  for update to authenticated using (true) with check (true);
create policy "posts_delete" on public.posts
  for delete to authenticated using (true);

-- TOOLS
drop policy if exists "tools_select" on public.tools;
drop policy if exists "tools_insert" on public.tools;
drop policy if exists "tools_update" on public.tools;
drop policy if exists "tools_delete" on public.tools;
create policy "tools_select" on public.tools
  for select using (published = true or auth.role() = 'authenticated');
create policy "tools_insert" on public.tools
  for insert to authenticated with check (true);
create policy "tools_update" on public.tools
  for update to authenticated using (true) with check (true);
create policy "tools_delete" on public.tools
  for delete to authenticated using (true);
