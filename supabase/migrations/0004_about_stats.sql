-- ============================================================================
--  Portfolio — migration 0004
--  Makes the home "About" headline stats (GPA, projects shipped, lines of OSS
--  code, years writing code) editable from the admin Settings page. Stored as a
--  JSON array of { value, suffix, label } so stats can be added/removed too.
--  Run in the Supabase SQL editor (or `supabase db push`) AFTER 0003.
-- ============================================================================

TRUNCATE TABLE public.about_scenes; 

INSERT INTO public.about_scenes (
    scene_order, badge_text, title_primary, title_highlight, subtitle_code, description, text_position, bg_kinetic_text, button_label, button_url, published
) VALUES (
    1, 'BACKEND ENGINEER', 'Crafting Scalable', 'Microservices & APIs', 'pkg/main.go', 'Specializing in Go ecosystem, high-throughput distributed systems, event-driven architectures, and high-availability database designs for modern enterprise applications.', 'left', 'GOLANG', 'Explore Projects', '/projects', true), (
    2, 'CURRENT ROLE', 'Building Core Banking Solutions at', 'PT Bank Sinarmas Tbk', 'bank_sinarmas.service', 'Developing asynchronous document processing pipelines, Kafka event publishing via Outbox Pattern, and automated K8s schedulers for high-traffic banking workflows.', 'right', 'BANKING', 'View Experience', '#path-so-far', true), (
    3, 'ARCHITECTURAL FOCUS', 'Event-Driven Systems &', 'Clean Architecture', 'net/http::200_OK', 'Passionate about maintainable code structures, gRPC API gateways, and zero-downtime microservice migrations. Open for technical discussions & engineering collaborations.', 'left', 'SCALE', 'Get In Touch', '/contact', true
);

alter table public.site_settings
  add column if not exists stats jsonb not null default '[
    { "value": 3.0, "suffix": " / 4.0", "label": "Current GPA" },
    { "value": 3, "suffix": "+", "label": "Years writing code" },
    { "value": 2, "suffix": "+", "label": "Projects shipped" },
    { "value": 50, "suffix": "+", "label": "Unit Testing" },
    { "value": 8, "suffix": "k", "label": "Lines of OSS code" }
  ]'::jsonb;
