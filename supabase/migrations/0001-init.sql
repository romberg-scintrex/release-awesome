-- ============================================================================
--  Portfolio — initial schema, RLS policies, and storage bucket
--  Run this in the Supabase SQL editor (or `supabase db push`).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
--  PROJECTS
-- ─────────────────────────────────────────────
create table if not exists public.projects (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  title            text not null,
  description      text not null default '',
  long_description text not null default '',
  categories       text[] not null default '{}',
  technologies     text[] not null default '{}',
  year             int  not null default extract(year from now())::int,
  featured         boolean not null default false,
  published        boolean not null default false,
  gallery          jsonb not null default '[]'::jsonb,     -- [{ "type":"image"|"video", "url":"...", "caption":"" }]
  thumbnail_url    text,
  live_url         text,
  github_url       text,
  linkedin_url     text,
  gradient         text not null default 'from-brand-violet via-brand-fuchsia to-brand-rose',
  sort_order       int  not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists projects_published_idx on public.projects (published);
create index if not exists projects_sort_idx on public.projects (sort_order, year desc);

-- ─────────────────────────────────────────────
--  TESTIMONIALS  ("what people say")
-- ─────────────────────────────────────────────
create table if not exists public.testimonials (
  id          uuid primary key default gen_random_uuid(),
  quote       text not null,
  name        text not null,
  role        text not null default '',
  avatar_url  text,
  published   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
--  SITE SETTINGS  (single row: profile, socials, images, CV)
-- ─────────────────────────────────────────────
create table if not exists public.site_settings (
  id               int primary key default 1,
  name             text not null default 'Gregorius Dimas A Yudhana',
  short_name       text not null default 'Grek',
  role             text not null default 'Software Engineer',
  university       text not null default 'Universitas Brawijaya',
  location         text not null default 'Jakarta, Indonesia',
  email            text not null default 'dimas.yudhana@gmail.com',
  description      text not null default 'Software engineer with a passion for building reliable, scalable and modern web applications.',
  social_github    text not null default 'https://github.com/dimasyudhana',
  social_linkedin  text not null default 'https://www.linkedin.com/in/gregorius-dimas-a-yudhana-820008251/',
  social_facebook  text not null default 'https://www.facebook.com/profile.php?id=100081008444052',
  social_instagram text not null default 'https://www.instagram.com/dimas.yudhana/',
  hero_back_url    text,   -- null → bundled /images/back_image.png
  hero_front_url   text,   -- null → bundled /images/front_image.png
  hero_mobile_url  text,   -- null → bundled /images/back_image.png
  cv_url           text,   -- null → /cv.pdf (if present)
  updated_at       timestamptz not null default now(),
  constraint site_settings_singleton check (id = 1)
);

-- ─────────────────────────────────────────────
--  updated_at trigger
-- ─────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_projects_updated on public.projects;
create trigger trg_projects_updated before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists trg_testimonials_updated on public.testimonials;
create trigger trg_testimonials_updated before update on public.testimonials
  for each row execute function public.set_updated_at();

drop trigger if exists trg_settings_updated on public.site_settings;
create trigger trg_settings_updated before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ============================================================================
--  ROW LEVEL SECURITY
--  Public (anon) can read published content + settings.
--  Any authenticated user (= the admin; public sign-ups are disabled in the
--  Supabase dashboard) can read everything and write.
-- ============================================================================
alter table public.projects      enable row level security;
alter table public.testimonials  enable row level security;
alter table public.site_settings enable row level security;

-- PROJECTS
drop policy if exists "projects_select"  on public.projects;
drop policy if exists "projects_insert"  on public.projects;
drop policy if exists "projects_update"  on public.projects;
drop policy if exists "projects_delete"  on public.projects;
create policy "projects_select" on public.projects
  for select using (published = true or auth.role() = 'authenticated');
create policy "projects_insert" on public.projects
  for insert to authenticated with check (true);
create policy "projects_update" on public.projects
  for update to authenticated using (true) with check (true);
create policy "projects_delete" on public.projects
  for delete to authenticated using (true);

-- TESTIMONIALS
drop policy if exists "testimonials_select" on public.testimonials;
drop policy if exists "testimonials_insert" on public.testimonials;
drop policy if exists "testimonials_update" on public.testimonials;
drop policy if exists "testimonials_delete" on public.testimonials;
create policy "testimonials_select" on public.testimonials
  for select using (published = true or auth.role() = 'authenticated');
create policy "testimonials_insert" on public.testimonials
  for insert to authenticated with check (true);
create policy "testimonials_update" on public.testimonials
  for update to authenticated using (true) with check (true);
create policy "testimonials_delete" on public.testimonials
  for delete to authenticated using (true);

-- SITE SETTINGS (single public row)
drop policy if exists "settings_select" on public.site_settings;
drop policy if exists "settings_insert" on public.site_settings;
drop policy if exists "settings_update" on public.site_settings;
create policy "settings_select" on public.site_settings
  for select using (true);
create policy "settings_insert" on public.site_settings
  for insert to authenticated with check (true);
create policy "settings_update" on public.site_settings
  for update to authenticated using (true) with check (true);

-- ============================================================================
--  STORAGE  — public "media" bucket for uploaded images / videos / CV
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media_public_read"  on storage.objects;
drop policy if exists "media_auth_insert"   on storage.objects;
drop policy if exists "media_auth_update"   on storage.objects;
drop policy if exists "media_auth_delete"   on storage.objects;
create policy "media_public_read" on storage.objects
  for select using (bucket_id = 'media');
create policy "media_auth_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'media');
create policy "media_auth_update" on storage.objects
  for update to authenticated using (bucket_id = 'media');
create policy "media_auth_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'media');
