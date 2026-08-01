-- ============================================================================
--  Dummy seed data — run AFTER 0001_init.sql.
--  These projects are published so the live site has content immediately.
--  Unpublish / delete them from the admin panel once you add real posts.
--  Images use picsum.photos; one gallery has a sample video.
-- ============================================================================

-- Ensure the singleton settings row exists (columns already carry sensible
-- defaults from the migration).
insert into public.site_settings (id) values (1)
on conflict (id) do nothing;

-- ─────────────────────────────────────────────
--  PROJECTS
-- ─────────────────────────────────────────────
insert into public.projects
  (slug, title, description, long_description, categories, tech, year, featured, published, thumbnail_url, gallery, live_url, github_url, linkedin_url, gradient, sort_order)
values
  (
    'ecomm',
    'E-Commerce Platform',
    'Production-grade storefront with Stripe payments, multi-vendor admin, and a Next.js + PostgreSQL stack.',
    'Full-fledged e-commerce engine — products, variants, inventory, multi-vendor admin, Stripe Connect, and a server-rendered storefront optimized for Core Web Vitals.',
    array['Web'],
    array['Next.js','PostgreSQL','Prisma','Stripe','Tailwind'],
    2024, false, true,
    'https://picsum.photos/seed/ecomm/1200/800',
    '[{"type":"image","url":"https://picsum.photos/seed/ecomm-a/1600/1000","caption":"Storefront"},
      {"type":"image","url":"https://picsum.photos/seed/ecomm-b/1600/1000","caption":"Vendor admin"}]'::jsonb,
    'https://shop.kalanalk.com', 'https://github.com/kalanas210/ecomm', null,
    'from-brand-emerald via-brand-cyan to-brand-violet', 3
  ),
  (
    'portfolio',
    'Portfolio Website',
    'The site you''re on — Next.js 16, Framer Motion, and a WebGL fluid simulation hero.',
    'A handcrafted portfolio that doubles as a playground for shader work, motion design, and accessibility-first interaction. Built in the open.',
    array['Web','Open Source'],
    array['Next.js','Framer Motion','Three.js','Tailwind'],
    2026, false, true,
    'https://picsum.photos/seed/portfolio/1200/800',
    '[{"type":"image","url":"https://picsum.photos/seed/portfolio-a/1600/1000","caption":"Hero"}]'::jsonb,
    'https://kalanalk.com', 'https://github.com/kalanas210/portfolio', null,
    'from-brand-fuchsia via-brand-violet to-brand-cyan', 5
  )
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────
--  TESTIMONIALS
-- ─────────────────────────────────────────────
insert into public.testimonials (quote, name, role, published, sort_order) values
  ('Dimas Yudhana''s work has this rare quality — every detail looks intentional. The product feels handmade, but ships like a machine.',
   'John Boast', 'Lead Engineer, Release Awesome', true, 1),
  ('One of the most thoughtful junior engineers I''ve collaborated with. He treats the user, the codebase, and his teammates with the same care.',
   'Peter Zalai', 'Senior Designer, Racoon', true, 2),
  ('Picked up Golang in a weekend and shipped a clean microservice the following week. Curious, kind, and quick.',
   'Richard Barker', 'Imperial College London', true, 3)
on conflict do nothing;

-- ─────────────────────────────────────────────
--  BLOG  (one sample post — unpublish/delete once you write real ones).
--  Requires migration 0002. Dollar-quoted so Markdown can use ' and `.
-- ─────────────────────────────────────────────
insert into public.posts
  (slug, title, excerpt, content, cover_url, tags, featured, published, published_at, sort_order)
values (
  'hello-world',
  'Building this portfolio: motion, shaders, and a CMS',
  'A quick tour of how this site is put together — Next.js 16, Framer Motion, a WebGL hero, and a Supabase-backed admin for projects, blog, and tools.',
  $md$Welcome to the blog! This first post is seeded so you can see how Markdown renders — headings, lists, quotes, and code are all styled for you.

## What powers this site

- **Next.js 16** with the App Router and React Server Components
- **Framer Motion** for the choreography
- **Supabase** for the admin, blog, and tools
- **Tailwind CSS** for styling

```ts
export function greet(name: string) {
  return `Hi, ${name}! Welcome to the blog.`;
}
```

> Write in plain Markdown. Edit or delete this post anytime from `/admin/blog`.

Happy writing!
$md$,
  'https://picsum.photos/seed/blog-hello/1200/630',
  array['Next.js','Design','Meta'],
  true, true, now(), 1
)
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────
--  TOOLS  (the free, in-browser background remover).
--  kind = 'embedded' renders the built-in component keyed by component_key.
-- ─────────────────────────────────────────────
insert into public.tools
  (slug, name, tagline, description, category, icon, cover_url, gradient, kind, component_key, external_url, featured, published, sort_order)
values (
  'background-remover',
  'Free Background Remover',
  'Remove the background from any image — instantly, privately, right in your browser.',
  $md$Upload an image and get a clean, transparent PNG back in seconds. **Everything runs locally in your browser** — your images are never uploaded to a server, so it stays completely private and free.

### Great for
- Product photos and e-commerce listings
- Profile pictures and avatars
- Stickers and design assets

The first run downloads a small AI model once, then every removal after that is instant.
$md$,
  'Image',
  'Scissors',
  'https://picsum.photos/seed/bg-remover/1200/630',
  'from-brand-cyan via-brand-violet to-brand-fuchsia',
  'embedded', 'background-remover', null,
  true, true, 1
)
on conflict (slug) do nothing;

-- More embedded tools (image toolkit, QR, dev utilities, OCR).
insert into public.tools
  (slug, name, tagline, description, category, icon, cover_url, gradient, kind, component_key, external_url, featured, published, sort_order)
values
  (
    'image-compressor', 'Image Compressor',
    'Shrink JPG, PNG & WebP file sizes without leaving your browser.',
    $md$Drop in a JPG, PNG, or WebP and pull the file size down with a quality slider — perfect for faster pages and email-friendly attachments. **Everything runs in your browser**, so nothing is uploaded.$md$,
    'Image', 'FileArchive', null, 'from-brand-emerald via-brand-cyan to-brand-violet',
    'embedded', 'image-compressor', null, true, true, 2
  ),
  (
    'image-converter', 'Image Converter',
    'Convert images between PNG, JPG, and WebP instantly.',
    $md$Switch an image between **PNG**, **JPG**, and **WebP** in a click. Great for shrinking photos to WebP or flattening a transparent PNG onto a white background. Fully client-side.$md$,
    'Image', 'Repeat', null, 'from-brand-cyan via-brand-violet to-brand-fuchsia',
    'embedded', 'image-converter', null, false, true, 3
  ),
  (
    'image-resizer', 'Image Resizer',
    'Resize images to exact dimensions, with optional aspect lock.',
    $md$Set an exact width and height — with optional aspect-ratio lock — and download the resized image. Runs entirely on your device.$md$,
    'Image', 'Scaling', null, 'from-brand-violet via-brand-fuchsia to-brand-rose',
    'embedded', 'image-resizer', null, false, true, 4
  ),
  (
    'qr-code-generator', 'QR Code Generator',
    'Create custom QR codes and download them as PNG or SVG.',
    $md$Turn any link or text into a crisp **QR code**. Pick the size and colors, then download as **PNG or SVG** for print or web. Generated locally — your data never leaves the page.$md$,
    'Generators', 'QrCode', null, 'from-brand-amber via-brand-rose to-brand-fuchsia',
    'embedded', 'qr-code-generator', null, true, true, 5
  ),
  (
    'json-formatter', 'JSON Formatter',
    'Format, validate, and minify JSON in one click.',
    $md$Paste messy JSON to **pretty-print** it, catch syntax errors, or **minify** it for production. Pure client-side — nothing leaves your browser.$md$,
    'Developer', 'Braces', null, 'from-brand-fuchsia via-brand-violet to-brand-cyan',
    'embedded', 'json-formatter', null, false, true, 6
  ),
  (
    'jwt-decoder', 'JWT Decoder',
    'Decode and inspect JSON Web Tokens — header, payload, and expiry.',
    $md$Paste a **JSON Web Token** to read its header and payload and check the expiry. Decoding only — the signature is not verified and nothing is sent anywhere.$md$,
    'Developer', 'KeyRound', null, 'from-brand-rose via-brand-amber to-brand-emerald',
    'embedded', 'jwt-decoder', null, false, true, 7
  ),
  (
    'base64', 'Base64 Encoder / Decoder',
    'Encode text to Base64 or decode it back — UTF-8 safe.',
    $md$Encode text to **Base64** or decode it back. Handles emoji and accented characters correctly (UTF-8 safe), all in your browser.$md$,
    'Developer', 'Binary', null, 'from-brand-emerald via-brand-cyan to-brand-violet',
    'embedded', 'base64', null, false, true, 8
  )
on conflict (slug) do nothing;


-- Developer tools: converters, generators, time/number/network, and text/regex.
insert into public.tools
  (slug, name, tagline, description, category, icon, cover_url, gradient, kind, component_key, external_url, featured, published, sort_order)
values
  ('json-yaml', 'JSON to YAML Converter', 'Convert between JSON and YAML in both directions.',
   $md$Paste JSON or YAML and convert it to the other format instantly. Runs entirely in your browser.$md$,
   'Converters', 'FileJson', null, 'from-brand-cyan via-brand-violet to-brand-fuchsia', 'embedded', 'json-yaml', null, true, true, 12),
  ('json-csv', 'JSON to CSV Converter', 'Convert JSON arrays to CSV and back.',
   $md$Turn a JSON array of objects into CSV, or parse CSV back into JSON. Handy for spreadsheets and data wrangling.$md$,
   'Converters', 'Table', null, 'from-brand-violet via-brand-fuchsia to-brand-rose', 'embedded', 'json-csv', null, false, true, 13),
  ('json-to-typescript', 'JSON to TypeScript', 'Generate TypeScript interfaces from any JSON.',
   $md$Paste a JSON sample and get strongly-typed TypeScript interfaces back — keys across array items are merged automatically.$md$,
   'Converters', 'FileCode2', null, 'from-brand-emerald via-brand-cyan to-brand-violet', 'embedded', 'json-to-typescript', null, false, true, 14),
  ('sql-formatter', 'SQL Formatter', 'Format and beautify SQL across many dialects.',
   $md$Clean up messy SQL with proper indentation and keyword casing. Supports MySQL, PostgreSQL, SQL Server, BigQuery, and more.$md$,
   'Converters', 'Database', null, 'from-brand-amber via-brand-rose to-brand-fuchsia', 'embedded', 'sql-formatter', null, false, true, 15),
  ('xml-formatter', 'XML & HTML Formatter', 'Beautify or minify XML and HTML markup.',
   $md$Pretty-print tangled XML or HTML, or minify it down. All in your browser.$md$,
   'Converters', 'FileCode', null, 'from-brand-fuchsia via-brand-violet to-brand-cyan', 'embedded', 'xml-formatter', null, false, true, 16),
  ('curl-to-code', 'cURL to Code Converter', 'Turn a curl command into fetch or axios code.',
   $md$Paste a `curl` command and get clean JavaScript `fetch` or `axios` code — method, headers, and body included.$md$,
   'Converters', 'Terminal', null, 'from-brand-rose via-brand-amber to-brand-emerald', 'embedded', 'curl-to-code', null, false, true, 17),
  ('uuid-generator', 'UUID Generator', 'Generate UUID v4 and v7 in bulk.',
   $md$Generate cryptographically-random **UUID v4** or time-ordered **UUID v7** identifiers — one or hundreds at a time.$md$,
   'Generators', 'Fingerprint', null, 'from-brand-cyan via-brand-violet to-brand-fuchsia', 'embedded', 'uuid-generator', null, false, true, 18),
  ('password-generator', 'Password Generator', 'Create strong, random passwords privately.',
   $md$Generate secure passwords with the browser's cryptographic RNG. Tune length and character sets; look-alike characters are excluded.$md$,
   'Generators', 'LockKeyhole', null, 'from-brand-violet via-brand-fuchsia to-brand-rose', 'embedded', 'password-generator', null, true, true, 19),
  ('bcrypt', 'Bcrypt Hash & Verify', 'Hash a password with bcrypt or verify one.',
   $md$Generate a bcrypt hash at a chosen cost factor, or check whether a password matches an existing hash.$md$,
   'Generators', 'Lock', null, 'from-brand-emerald via-brand-cyan to-brand-violet', 'embedded', 'bcrypt', null, false, true, 20),
  ('hmac-generator', 'HMAC Generator', 'Generate an HMAC signature with Web Crypto.',
   $md$Compute an HMAC (SHA-256/384/512/1) from a message and secret key, locally via the Web Crypto API.$md$,
   'Generators', 'ShieldCheck', null, 'from-brand-amber via-brand-rose to-brand-fuchsia', 'embedded', 'hmac-generator', null, false, true, 21),
  ('gitignore-generator', '.gitignore Generator', 'Build a .gitignore tailored to your stack.',
   $md$Pick your languages, frameworks, and editors and get a combined `.gitignore` ready to copy or download.$md$,
   'Generators', 'GitBranch', null, 'from-brand-fuchsia via-brand-violet to-brand-cyan', 'embedded', 'gitignore-generator', null, false, true, 22),
  ('fake-data', 'Fake Data Generator', 'Generate realistic mock JSON or CSV test data.',
   $md$Choose fields and generate rows of realistic fake data (names, emails, addresses, and more) as JSON or CSV.$md$,
   'Generators', 'Dices', null, 'from-brand-rose via-brand-amber to-brand-emerald', 'embedded', 'fake-data', null, false, true, 23),
  ('unix-timestamp', 'Unix Timestamp Converter', 'Convert between Unix time and human dates.',
   $md$Convert a Unix timestamp (seconds or milliseconds) to ISO, UTC, local, and relative time — or go the other way.$md$,
   'Developer', 'Clock', null, 'from-brand-cyan via-brand-violet to-brand-fuchsia', 'embedded', 'unix-timestamp', null, true, true, 24),
  ('cron-explainer', 'Cron Expression Explainer', 'Translate cron to plain English and see next runs.',
   $md$Paste a cron expression to get a plain-English description and a preview of the next five run times.$md$,
   'Developer', 'CalendarClock', null, 'from-brand-violet via-brand-fuchsia to-brand-rose', 'embedded', 'cron-explainer', null, false, true, 25),
  ('number-base', 'Number Base Converter', 'Convert between binary, octal, decimal, and hex.',
   $md$Enter a number in any base and see it in binary, octal, decimal, and hexadecimal — with arbitrary-precision support.$md$,
   'Developer', 'Binary', null, 'from-brand-emerald via-brand-cyan to-brand-violet', 'embedded', 'number-base', null, false, true, 26),
  ('subnet-calculator', 'IP Subnet Calculator', 'Network, broadcast, mask, and host range from CIDR.',
   $md$Enter an IPv4 address in CIDR notation to compute the network and broadcast addresses, subnet mask, and usable host range.$md$,
   'Network', 'Network', null, 'from-brand-amber via-brand-rose to-brand-fuchsia', 'embedded', 'subnet-calculator', null, false, true, 27),
  ('contrast-checker', 'Color Contrast Checker', 'Check WCAG contrast between two colors.',
   $md$Compare a text and background color to get the contrast ratio and whether it passes WCAG AA/AAA for normal and large text.$md$,
   'Design', 'Contrast', null, 'from-brand-fuchsia via-brand-violet to-brand-cyan', 'embedded', 'contrast-checker', null, false, true, 28),
  ('regex-tester', 'Regex Tester', 'Test regular expressions with live highlighting.',
   $md$Write a pattern and flags, then see every match highlighted in your test string, with capture groups listed.$md$,
   'Text', 'Regex', null, 'from-brand-rose via-brand-amber to-brand-emerald', 'embedded', 'regex-tester', null, true, true, 29),
  ('diff-checker', 'Text Diff Checker', 'Compare two texts and view the differences.',
   $md$Paste two versions of some text and see a clear line-by-line diff of what was added and removed.$md$,
   'Text', 'GitCompare', null, 'from-brand-cyan via-brand-violet to-brand-fuchsia', 'embedded', 'diff-checker', null, false, true, 30),
  ('case-converter', 'Case Converter', 'Convert text between camelCase, snake_case, and more.',
   $md$Instantly convert text into camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, Title Case, and more.$md$,
   'Text', 'CaseSensitive', null, 'from-brand-violet via-brand-fuchsia to-brand-rose', 'embedded', 'case-converter', null, false, true, 31),
  ('string-escape', 'String Escape & Unescape', 'Escape or unescape JSON, JS, HTML, and SQL.',
   $md$Escape a string for JSON, JavaScript, HTML, or SQL — or reverse it back to plain text.$md$,
   'Text', 'Quote', null, 'from-brand-emerald via-brand-cyan to-brand-violet', 'embedded', 'string-escape', null, false, true, 32),
  ('text-utilities', 'Text Utilities', 'Slugify, count, sort, dedupe, and clean text.',
   $md$A grab-bag of everyday text operations: slugify, word/line counts, sort lines, remove duplicates, trim, and case changes.$md$,
   'Text', 'WrapText', null, 'from-brand-amber via-brand-rose to-brand-fuchsia', 'embedded', 'text-utilities', null, false, true, 33),
  ('markdown-preview', 'Markdown Previewer', 'Write Markdown and preview it live.',
   $md$Type Markdown on the left and watch it render — with the same styling used across this site's blog — on the right.$md$,
   'Text', 'FileText', null, 'from-brand-fuchsia via-brand-violet to-brand-cyan', 'embedded', 'markdown-preview', null, false, true, 34)
on conflict (slug) do nothing;