-- ============================================================================
--  Portfolio — migration 0003
--  Adds home-page section toggles. The home Tools/Blog sections render the
--  items already marked "featured"; these flags just turn each section on/off.
--  Run in the Supabase SQL editor (or `supabase db push`) AFTER 0002.
-- ============================================================================

alter table public.site_settings
  add column if not exists home_show_tools boolean not null default true,
  add column if not exists home_show_blog  boolean not null default true;
