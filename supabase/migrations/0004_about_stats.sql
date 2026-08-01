-- ============================================================================
--  Portfolio — migration 0004
--  Makes the home "About" headline stats (GPA, projects shipped, lines of OSS
--  code, years writing code) editable from the admin Settings page. Stored as a
--  JSON array of { value, suffix, label } so stats can be added/removed too.
--  Run in the Supabase SQL editor (or `supabase db push`) AFTER 0003.
-- ============================================================================

alter table public.site_settings
  add column if not exists stats jsonb not null default '[
    { "value": 3.0, "suffix": " / 4.0", "label": "Current GPA" },
    { "value": 3, "suffix": "+", "label": "Years writing code" },
    { "value": 2, "suffix": "+", "label": "Projects shipped" },
    { "value": 50, "suffix": "+", "label": "Unit Testing" },
    { "value": 8, "suffix": "k", "label": "Lines of OSS code" }
  ]'::jsonb;
