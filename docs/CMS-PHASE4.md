# DigiSutra CMS — Phase 4: Blog, Media, Forms, Search

## Media library

- Upload JPG/PNG/WebP/AVIF/GIF/SVG (≤10 MB, 30/10min rate limit).
  Raster images are auto-converted to WebP (quality 82), EXIF-rotated,
  capped at 2560px; dimensions recorded. `lib/storage.ts` writes to
  `public/uploads/` — **swap internals for Vercel Blob/S3 before
  production deploy** (ephemeral filesystem on Vercel).
- Admin: `/admin/media` — upload, grid, inline ALT editing (blur-save),
  copy URL, delete. Permission: `media.upload` (Admin, Developer, SEO);
  all panel roles can browse.
- API: `GET/POST /api/media`, `PATCH/DELETE /api/media/:id`.

## Blog system

- `BlogPost`: slug, excerpt, body, category, tags[], cover URL, status
  lifecycle (same as pages), reading time (auto, ~200 wpm), SEO fields,
  author snapshot.
- Body format: blank-line paragraphs, `## ` / `### ` headings (rich-text
  editor is a Phase 5+ upgrade).
- Admin: `/admin/blog` list + editor (content, category/tags/cover
  sidebar, SEO card, publish controls). Permissions: `blog.manage`
  (Admin, SEO Manager), `blog.publish` (Admin).
- Public: `/blog` (category filter chips), `/blog/[slug]` (Article
  JSON-LD, OG/Twitter meta, canonical, related posts by category,
  tags). Home journal section now pulls the latest 3 published posts
  (static placeholders remain as fallback when none exist). Sitemap
  includes published posts.
- API: `GET/POST /api/posts`, `GET/PATCH/DELETE /api/posts/:id`,
  `POST /api/posts/:id/publish`.

## Form builder

- `Form` (name, slug, typed fields JSON, notify email, active flag) +
  `FormSubmission`. Field types: text, email, tel, textarea, select
  (with options); required flags. Definitions validated by zod on both
  save and submit (`lib/cms/forms.ts`).
- Embedding: add a **Form section** to any CMS page and set the form's
  slug — `FormEmbed` fetches the definition and renders it client-side.
- Public submit: `POST /api/form-submissions` — honeypot, 8/10min/IP
  rate limit, per-field validation, stores submission, notifies Super
  Admins in-app and the form's notify email via Resend.
- Admin: `/admin/forms` — build/edit fields, active toggle, submissions
  table, **CSV export** (`?format=csv`). Permission: `forms.manage`
  (Admin, Developer).

## Search

- Public `/search` page: case-insensitive match over published pages
  (title, description) and posts (title, excerpt, body). Upgrade path:
  Postgres full-text (tsvector) when content volume warrants it.

## Verified

Blog list/article render with Article schema and headings; search finds
seeded content; form definition served publicly, invalid submit rejected
with field-specific error, valid submit stored + CSV exported with
correct header; canvas-generated PNG uploaded → 5.6 KB WebP at
`/uploads/…` served with correct content-type; home page shows DB posts.
RBAC: Developer 403 on blog / 200 on forms, Tester 403 on media upload,
SEO Manager 200 on blog. Production build: 44 routes clean.

## Seeded

2 published articles, the `lead-form` (name/email/service/message).
