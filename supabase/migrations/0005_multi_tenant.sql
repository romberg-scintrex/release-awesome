-- =============================================================================
-- Migration 0005: Multi-Tenant Portfolio
-- =============================================================================
-- This migration transforms the single-tenant portfolio into a multi-tenant
-- platform. It is structured in sections that must be applied in order.
-- All DDL statements use IF NOT EXISTS / IF EXISTS guards for idempotency.
-- =============================================================================


-- =============================================================================
-- Section 1: profiles table, indexes, and RLS policies
-- =============================================================================

create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  username         text unique not null,
  name             text not null,
  short_name       text not null default '',
  role             text not null default '',
  university       text not null default '',
  location         text not null default '',
  email            text not null default '',
  description      text not null default '',
  social_github    text not null default '',
  social_linkedin  text not null default '',
  social_facebook  text not null default '',
  social_instagram text not null default '',
  hero_back_url    text,
  hero_front_url   text,
  hero_mobile_url  text,
  about_image_url  text,
  cv_url           text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create unique index if not exists profiles_username_idx on public.profiles (username);
create index        if not exists profiles_id_idx       on public.profiles (id);

alter table public.profiles enable row level security;

-- Drop then recreate so the migration is idempotent
-- (CREATE POLICY does not support IF NOT EXISTS in PostgreSQL)
drop policy if exists "profiles_anon_select"  on public.profiles;
drop policy if exists "profiles_auth_select"  on public.profiles;
drop policy if exists "profiles_auth_insert"  on public.profiles;
drop policy if exists "profiles_auth_update"  on public.profiles;

-- Anon: read any profile (public portfolios are visible to everyone)
create policy "profiles_anon_select" on public.profiles
  for select using (true);

-- Auth: read own row
create policy "profiles_auth_select" on public.profiles
  for select to authenticated using (auth.uid() = id);

-- Auth: insert own row (trigger uses security definer, but also allow direct insert)
create policy "profiles_auth_insert" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- Auth: update own row
create policy "profiles_auth_update" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- =============================================================================
-- Section 2: Migrate site_settings → profiles (idempotent DO block)
-- =============================================================================

do $$
begin
  if not exists (select 1 from public.profiles limit 1) then
    if not exists (select 1 from public.site_settings where id = 1) then
      raise exception 'profiles migration failed: site_settings row id=1 does not exist';
    end if;

    insert into public.profiles (
      id, username, name, short_name, role, university, location, email,
      description, social_github, social_linkedin, social_facebook,
      social_instagram, hero_back_url, hero_front_url, hero_mobile_url,
      about_image_url, cv_url
    )
    select
      (select id from auth.users order by created_at asc limit 1),
      'dimasyudhana',
      name, short_name, role, university, location, email, description,
      social_github, social_linkedin, social_facebook, social_instagram,
      hero_back_url, hero_front_url, hero_mobile_url, about_image_url, cv_url
    from public.site_settings
    where id = 1
    on conflict (id) do nothing;
  end if;
end $$;

-- =============================================================================
-- Section 3: Add user_id to content tables, backfill, and update RLS policies
-- =============================================================================

-- Add user_id column to content tables
alter table public.projects     add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.testimonials add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.about_scenes add column if not exists user_id uuid references public.profiles(id) on delete cascade;

-- Backfill existing rows with the primary owner's profile id
update public.projects
  set user_id = (select id from public.profiles order by created_at asc limit 1)
  where user_id is null;

update public.testimonials
  set user_id = (select id from public.profiles order by created_at asc limit 1)
  where user_id is null;

update public.about_scenes
  set user_id = (select id from public.profiles order by created_at asc limit 1)
  where user_id is null;

-- projects: drop and recreate RLS policies
drop policy if exists "projects_select" on public.projects;
drop policy if exists "projects_insert" on public.projects;
drop policy if exists "projects_update" on public.projects;
drop policy if exists "projects_delete" on public.projects;

create policy "projects_select" on public.projects
  for select using (
    published = true
    or user_id = (select id from public.profiles where id = auth.uid())
  );
create policy "projects_insert" on public.projects
  for insert to authenticated
  with check (user_id = (select id from public.profiles where id = auth.uid()));
create policy "projects_update" on public.projects
  for update to authenticated
  using (user_id = (select id from public.profiles where id = auth.uid()))
  with check (user_id = (select id from public.profiles where id = auth.uid()));
create policy "projects_delete" on public.projects
  for delete to authenticated
  using (user_id = (select id from public.profiles where id = auth.uid()));

-- testimonials: drop and recreate RLS policies
drop policy if exists "testimonials_select" on public.testimonials;
drop policy if exists "testimonials_insert" on public.testimonials;
drop policy if exists "testimonials_update" on public.testimonials;
drop policy if exists "testimonials_delete" on public.testimonials;

create policy "testimonials_select" on public.testimonials
  for select using (
    published = true
    or user_id = (select id from public.profiles where id = auth.uid())
  );
create policy "testimonials_insert" on public.testimonials
  for insert to authenticated
  with check (user_id = (select id from public.profiles where id = auth.uid()));
create policy "testimonials_update" on public.testimonials
  for update to authenticated
  using (user_id = (select id from public.profiles where id = auth.uid()))
  with check (user_id = (select id from public.profiles where id = auth.uid()));
create policy "testimonials_delete" on public.testimonials
  for delete to authenticated
  using (user_id = (select id from public.profiles where id = auth.uid()));

-- about_scenes: drop and recreate RLS policies
drop policy if exists "about_scenes_select" on public.about_scenes;
drop policy if exists "about_scenes_insert" on public.about_scenes;
drop policy if exists "about_scenes_update" on public.about_scenes;
drop policy if exists "about_scenes_delete" on public.about_scenes;

create policy "about_scenes_select" on public.about_scenes
  for select using (
    published = true
    or user_id = (select id from public.profiles where id = auth.uid())
  );
create policy "about_scenes_insert" on public.about_scenes
  for insert to authenticated
  with check (user_id = (select id from public.profiles where id = auth.uid()));
create policy "about_scenes_update" on public.about_scenes
  for update to authenticated
  using (user_id = (select id from public.profiles where id = auth.uid()))
  with check (user_id = (select id from public.profiles where id = auth.uid()));
create policy "about_scenes_delete" on public.about_scenes
  for delete to authenticated
  using (user_id = (select id from public.profiles where id = auth.uid()));

-- =============================================================================
-- Section 4: blogs table, indexes, and RLS policies
-- =============================================================================

create table if not exists public.blogs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  slug         text not null,
  title        text not null,
  summary      text not null default '',
  content      text not null default '',
  cover_url    text,
  published    boolean not null default false,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint blogs_user_slug_unique unique (user_id, slug)
);

create index if not exists blogs_user_published_idx on public.blogs (user_id, published, published_at desc);
create index if not exists blogs_slug_idx            on public.blogs (slug);

alter table public.blogs enable row level security;

-- Anon: read published blog posts
drop policy if exists "blogs_select" on public.blogs;
drop policy if exists "blogs_insert" on public.blogs;
drop policy if exists "blogs_update" on public.blogs;
drop policy if exists "blogs_delete" on public.blogs;

create policy "blogs_select" on public.blogs
  for select using (
    published = true
    or user_id = (select id from public.profiles where id = auth.uid())
  );
create policy "blogs_insert" on public.blogs
  for insert to authenticated
  with check (user_id = (select id from public.profiles where id = auth.uid()));
create policy "blogs_update" on public.blogs
  for update to authenticated
  using (user_id = (select id from public.profiles where id = auth.uid()))
  with check (user_id = (select id from public.profiles where id = auth.uid()));
create policy "blogs_delete" on public.blogs
  for delete to authenticated
  using (user_id = (select id from public.profiles where id = auth.uid()));

-- =============================================================================
-- Section 5: handle_new_user auth trigger for automatic profile creation
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username  text;
  v_name      text;
  v_base      text;
  v_suffix    int;
  v_candidate text;
begin
  v_username := nullif(trim(new.raw_user_meta_data->>'username'), '');
  v_name     := coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1));

  if v_username is null then
    v_username := split_part(new.email, '@', 1);
  end if;

  -- Uniqueness collision handling: append 4-digit suffix starting at 1000
  v_base      := v_username;
  v_candidate := v_base;
  v_suffix    := 1000;
  while exists (select 1 from public.profiles where username = v_candidate) loop
    v_candidate := v_base || '_' || v_suffix::text;
    v_suffix    := v_suffix + 1;
  end loop;

  insert into public.profiles (id, username, name)
  values (new.id, v_candidate, v_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Section 6: casbin_rule table and RBAC seed data
-- =============================================================================

create table if not exists public.casbin_rule (
  id    serial primary key,
  ptype text,
  v0    text,
  v1    text,
  v2    text,
  v3    text,
  v4    text,
  v5    text
);

-- Seed initial RBAC policies (idempotent)
-- role 'admin' may read: dashboard, projects, blog, settings
-- role 'editor' may read: dashboard, projects, blog
insert into public.casbin_rule (ptype, v0, v1, v2) values
  ('p', 'admin',  'dashboard', 'read'),
  ('p', 'admin',  'projects',  'read'),
  ('p', 'admin',  'blog',      'read'),
  ('p', 'admin',  'settings',  'read'),
  ('p', 'admin', 'about',        'read'),
  ('p', 'admin', 'tools',        'read'),
  ('p', 'admin', 'testimonials', 'read')
  ('p', 'editor', 'dashboard', 'read'),
  ('p', 'editor', 'projects',  'read'),
  ('p', 'editor', 'blog',      'read')
on conflict do nothing;

-- Role assignments: dimas → admin, yudhana → editor
insert into public.casbin_rule (ptype, v0, v1) values
  ('g', 'dimas',   'admin'),
  ('g', 'yudhana', 'editor')
on conflict do nothing;

-- =============================================================================
-- Section 7: Storage RLS — per-user path isolation
-- =============================================================================

-- Drop and recreate per-user write policies on storage.objects
-- Authenticated users may only write to objects under their own user_id prefix
drop policy if exists "media_auth_insert" on storage.objects;
drop policy if exists "media_auth_update" on storage.objects;
drop policy if exists "media_auth_delete" on storage.objects;

create policy "media_auth_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "media_auth_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "media_auth_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- NOTE: The existing anon public-read policy on the media bucket is retained
-- unchanged. This migration only replaces the authenticated write policies.

-- =============================================================================
-- Section: Multi-Tenant Tools Table
-- =============================================================================

create table if not exists public.tools (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  slug           text not null,
  name           text not null,
  tagline        text not null default '',
  description    text not null default '',
  category       text not null default 'Utility',
  icon           text,
  cover_url      text,
  gradient       text not null default 'from-brand-violet via-brand-fuchsia to-brand-rose',
  kind           text not null default 'embedded' check (kind in ('embedded','external')),
  component_key  text,
  external_url   text,
  featured       boolean not null default false,
  published      boolean not null default false,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint tools_user_slug_unique unique (user_id, slug)
);

-- Indeks khusus multi-tenant
create index if not exists tools_user_published_idx on public.tools (user_id, published, sort_order asc);
create index if not exists tools_slug_idx           on public.tools (slug);

-- Enable RLS
alter table public.tools enable row level security;

-- Drop existing policies
drop policy if exists "tools_select" on public.tools;
drop policy if exists "tools_insert" on public.tools;
drop policy if exists "tools_update" on public.tools;
drop policy if exists "tools_delete" on public.tools;

-- Policies (Pola sepadan dengan blogs)
create policy "tools_select" on public.tools
  for select using (
    published = true
    or user_id = (select id from public.profiles where id = auth.uid())
  );

create policy "tools_insert" on public.tools
  for insert to authenticated
  with check (user_id = (select id from public.profiles where id = auth.uid()));

create policy "tools_update" on public.tools
  for update to authenticated
  using (user_id = (select id from public.profiles where id = auth.uid()))
  with check (user_id = (select id from public.profiles where id = auth.uid()));

create policy "tools_delete" on public.tools
  for delete to authenticated
  using (user_id = (select id from public.profiles where id = auth.uid()));

-- =============================================================================
-- Migration: Add user_id to tools & convert to Multi-Tenant
-- =============================================================================

-- 1. Tambahkan kolom user_id jika belum ada
alter table public.tools 
  add column if not exists user_id uuid references public.profiles(id) on delete cascade;

-- 2. Backfill existing tools data dengan ID profile pemilik pertama (jika ada data lama)
update public.tools
  set user_id = (select id from public.profiles order by created_at asc limit 1)
  where user_id is null;

-- 3. Hapus constraint slug unik global lama (jika ada) dan ganti ke composite (user_id, slug)
alter table public.tools drop constraint if exists tools_slug_key;
alter table public.tools drop constraint if exists tools_user_slug_unique;

alter table public.tools 
  add constraint tools_user_slug_unique unique (user_id, slug);

-- 4. Buat Indeks Multi-Tenant
drop index if exists public.tools_published_idx;
drop index if exists public.tools_order_idx;

create index if not exists tools_user_published_idx on public.tools (user_id, published, sort_order asc);
create index if not exists tools_slug_idx           on public.tools (slug);

-- 5. Perbarui Row Level Security (RLS) Policies
alter table public.tools enable row level security;

drop policy if exists "tools_select" on public.tools;
drop policy if exists "tools_insert" on public.tools;
drop policy if exists "tools_update" on public.tools;
drop policy if exists "tools_delete" on public.tools;

-- Public/Anon: hanya bisa baca tool yang published
create policy "tools_select" on public.tools
  for select using (
    published = true
    or user_id = (select id from public.profiles where id = auth.uid())
  );

-- Authenticated: hanya bisa manipulasi tool milik sendiri
create policy "tools_insert" on public.tools
  for insert to authenticated
  with check (user_id = (select id from public.profiles where id = auth.uid()));

create policy "tools_update" on public.tools
  for update to authenticated
  using (user_id = (select id from public.profiles where id = auth.uid()))
  with check (user_id = (select id from public.profiles where id = auth.uid()));

create policy "tools_delete" on public.tools
  for delete to authenticated
  using (user_id = (select id from public.profiles where id = auth.uid()));