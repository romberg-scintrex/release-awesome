-- =============================================================================
-- Migration 0006: Platform Signup
-- =============================================================================
-- Turns the multi-tenant schema from 0005 into one that can accept public
-- registrations safely. Four concerns, in an order that matters:
--
--   1. profiles.status                 - the waitlist state machine
--   2. approve pre-existing profiles   - MUST precede section 6
--   3. reserved_usernames              - one source of truth, readable by both
--                                        the trigger and the application
--   4. case-insensitive uniqueness     - replaces the case-sensitive index
--   5. hardened handle_new_user        - sanitise, reject reserved, resolve
--                                        collisions, start as pending
--   6. narrow anonymous RLS            - unapproved portfolios become invisible
--   7. drop casbin_rule                - per ADR-018
--
-- Every statement is guarded so the file can be applied repeatedly.
--
-- Spec: .claude/specs/platform-homepage-signup/
-- Object names were read out of 0005_multi_tenant.sql, not assumed; see that
-- spec's tasks.md -> "Verified object names" before editing any policy here.
-- =============================================================================


-- =============================================================================
-- Section 1: profiles.status
-- =============================================================================

alter table public.profiles
  add column if not exists status text not null default 'pending';

-- Recreated rather than added conditionally, so the allowed set is whatever
-- this migration says it is even if an earlier run used a different one.
alter table public.profiles
  drop constraint if exists profiles_status_check;
alter table public.profiles
  add constraint profiles_status_check
  check (status in ('pending', 'approved', 'rejected'));

create index if not exists profiles_status_idx on public.profiles (status);


-- =============================================================================
-- Section 2: approve profiles that already exist
-- =============================================================================
-- Load-bearing, and it MUST run before section 6. Any profile present when this
-- migration runs predates the waitlist and is already serving a live portfolio;
-- leaving it 'pending' would 404 that portfolio the moment RLS narrows below.
--
-- Scoped to rows still sitting at the column default, so re-running this file
-- never revives a profile an operator has since rejected.

update public.profiles
   set status = 'approved'
 where status = 'pending';


-- =============================================================================
-- Section 3: reserved_usernames
-- =============================================================================
-- /:username is a top-level dynamic segment and Next.js resolves static routes
-- first, so a username equal to a static path yields a tenant whose portfolio
-- can never be served - with no error raised anywhere. The router cannot report
-- this, which is why the refusal has to live here.
--
-- A table rather than a constant in two places: a plpgsql trigger cannot read a
-- TypeScript array, and a duplicated list drifts. Adding a reserved word is now
-- one INSERT, not a deploy.

create table if not exists public.reserved_usernames (
  name text primary key
);

alter table public.reserved_usernames enable row level security;

-- Readable by everyone: the registration form checks a candidate before
-- submitting, and the list is not a secret.
drop policy if exists "reserved_usernames_select" on public.reserved_usernames;
create policy "reserved_usernames_select" on public.reserved_usernames
  for select using (true);

insert into public.reserved_usernames (name) values
  -- every static path at the root
  ('admin'), ('api'), ('register'), ('login'), ('logout'),
  ('_next'), ('next'), ('favicon.ico'), ('opengraph-image'),
  ('robots.txt'), ('sitemap.xml'), ('index'),
  -- words a platform is likely to claim later
  ('about'), ('contact'), ('blog'), ('tools'), ('settings'), ('dashboard'),
  ('pricing'), ('terms'), ('privacy'), ('docs'), ('help'), ('support'),
  ('new'), ('edit'), ('static'), ('assets'), ('public'), ('www'), ('mail')
on conflict (name) do nothing;


-- =============================================================================
-- Section 4: case-insensitive username uniqueness
-- =============================================================================
-- 0005_multi_tenant.sql:37 created profiles_username_idx as a plain unique index
-- on (username), which is case-sensitive - so 'John' and 'john' could both
-- exist as distinct tenants whose URLs differ only by case.

drop index if exists public.profiles_username_idx;

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));


-- =============================================================================
-- Section 5: hardened handle_new_user
-- =============================================================================
-- Replaces the version in 0005, which derived a username with
-- split_part(email, '@', 1) and resolved collisions against profiles only. That
-- left three holes: no reserved-word check, no sanitisation, no case folding.
--
-- The asymmetry below is deliberate. A username the user TYPED is rejected with
-- a reason; a username DERIVED from their email is silently replaced with a safe
-- one. Renaming something somebody deliberately chose is worse than an error;
-- silently allocating one they never saw is fine.
--
-- Rejections raise with a parseable prefix so POST /api/register can turn them
-- into readable copy instead of leaking raw Postgres text.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requested text;      -- what the user explicitly asked for, if anything
  v_name      text;
  v_base      text;
  v_candidate text;
  v_suffix    int := 1;
  v_attempts  int := 0;
  v_explicit  boolean;
begin
  v_requested := nullif(trim(new.raw_user_meta_data->>'username'), '');
  v_explicit  := v_requested is not null;

  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    split_part(new.email, '@', 1)
  );

  -- Sanitise: lowercase, collapse anything outside [a-z0-9-] into a hyphen,
  -- collapse hyphen runs, trim leading and trailing hyphens.
  v_base := lower(coalesce(v_requested, split_part(new.email, '@', 1), ''));
  v_base := regexp_replace(v_base, '[^a-z0-9-]+', '-', 'g');
  v_base := regexp_replace(v_base, '-{2,}', '-', 'g');
  v_base := trim(both '-' from v_base);

  -- Cap the stem at 32 so a numeric suffix cannot push the result past the
  -- 40-character ceiling, then re-trim in case truncation exposed a hyphen.
  if length(v_base) > 32 then
    v_base := trim(both '-' from substring(v_base from 1 for 32));
  end if;

  if v_explicit then
    -- Strict path: the user chose this, so tell them when it cannot be used.
    if v_base <> lower(v_requested) or length(v_base) < 3 then
      raise exception
        'USERNAME_INVALID: % must be 3-40 characters, lowercase letters, digits and inner hyphens only',
        v_requested
        using errcode = 'P0001';
    end if;
    if exists (select 1 from public.reserved_usernames r where r.name = v_base) then
      raise exception 'USERNAME_RESERVED: % is not available', v_requested
        using errcode = 'P0001';
    end if;
    if exists (select 1 from public.profiles p where lower(p.username) = v_base) then
      raise exception 'USERNAME_TAKEN: % is already taken', v_requested
        using errcode = 'P0001';
    end if;
    v_candidate := v_base;
  else
    -- Derived path: the user never saw this value, so allocate silently.
    if length(v_base) < 3 then
      v_base := 'user';
    end if;

    v_candidate := v_base;
    while exists (select 1 from public.reserved_usernames r where r.name = v_candidate)
       or exists (select 1 from public.profiles p where lower(p.username) = v_candidate)
    loop
      v_attempts := v_attempts + 1;
      -- Bail out to something certainly unique rather than spin forever.
      if v_attempts > 50 then
        v_candidate := v_base || '-' || replace(gen_random_uuid()::text, '-', '');
        v_candidate := substring(v_candidate from 1 for 40);
        exit;
      end if;
      v_candidate := v_base || '-' || v_suffix::text;
      v_suffix    := v_suffix + 1;
    end loop;
  end if;

  insert into public.profiles (id, username, name, email, status)
  values (new.id, v_candidate, v_name, new.email, 'pending')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =============================================================================
-- Section 6: narrow anonymous reads to approved profiles
-- =============================================================================
-- MUST run after section 2.
--
-- The policies replaced here are the ones 0005 created. Three things about them
-- that an assumed name or shape would have got wrong:
--
--   * they are called <table>_select, NOT <table>_anon_select - dropping a name
--     that does not exist is a silent no-op and the permissive policy survives;
--   * they carry no `to anon` - one policy serves every role, so adding a
--     separate anon policy gates nothing, because policies are OR-ed;
--   * the owner branch lives inside that same policy, so replacing it without
--     carrying `or user_id = ...` forward would strip a tenant's access to its
--     own unpublished rows.

-- profiles: 0005 had `for select using (true)`. Narrowing it is safe because a
-- tenant still reads its own row through profiles_auth_select.
drop policy if exists "profiles_anon_select" on public.profiles;
create policy "profiles_anon_select" on public.profiles
  for select using (status = 'approved');

drop policy if exists "projects_select" on public.projects;
create policy "projects_select" on public.projects
  for select using (
    (
      published = true
      and exists (
        select 1 from public.profiles p
         where p.id = projects.user_id and p.status = 'approved'
      )
    )
    or user_id = (select id from public.profiles where id = auth.uid())
  );

drop policy if exists "testimonials_select" on public.testimonials;
create policy "testimonials_select" on public.testimonials
  for select using (
    (
      published = true
      and exists (
        select 1 from public.profiles p
         where p.id = testimonials.user_id and p.status = 'approved'
      )
    )
    or user_id = (select id from public.profiles where id = auth.uid())
  );

drop policy if exists "about_scenes_select" on public.about_scenes;
create policy "about_scenes_select" on public.about_scenes
  for select using (
    (
      published = true
      and exists (
        select 1 from public.profiles p
         where p.id = about_scenes.user_id and p.status = 'approved'
      )
    )
    or user_id = (select id from public.profiles where id = auth.uid())
  );

drop policy if exists "blogs_select" on public.blogs;
create policy "blogs_select" on public.blogs
  for select using (
    (
      published = true
      and exists (
        select 1 from public.profiles p
         where p.id = blogs.user_id and p.status = 'approved'
      )
    )
    or user_id = (select id from public.profiles where id = auth.uid())
  );

-- tools is per-tenant too: 0005 sections 7 and 8 give it user_id and the same
-- policy shape as the tables above.
drop policy if exists "tools_select" on public.tools;
create policy "tools_select" on public.tools
  for select using (
    (
      published = true
      and exists (
        select 1 from public.profiles p
         where p.id = tools.user_id and p.status = 'approved'
      )
    )
    or user_id = (select id from public.profiles where id = auth.uid())
  );


-- =============================================================================
-- Section 7: drop casbin_rule
-- =============================================================================
-- Casbin governed admin navbar visibility only; src/proxy.ts and requireAdmin()
-- are the actual guards. With one kind of user it computes the same answer for
-- everyone, and a newly registered tenant - having no `g` row - fell back to
-- dashboard-only and could not edit its own portfolio.
--
-- 0005's Section 6 that created this table has been removed, so on a fresh
-- install the table never exists. This drop is for databases where an earlier
-- run created it. See .claude/steering/decisions.md ADR-018.

drop table if exists public.casbin_rule;
