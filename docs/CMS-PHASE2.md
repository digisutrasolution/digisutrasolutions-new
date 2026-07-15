# DigiSutra CMS — Phase 2: Content

Pages built from typed section blocks, with draft → schedule → publish →
archive lifecycle, full version history, per-page SEO, and DB-driven
public rendering.

## Concepts

**Section blocks.** A page's content is an ordered JSON array of blocks.
Types live in `lib/cms/sections.ts` as zod schemas — the admin editor
builds its forms from them and the public renderer validates against
them, so editor and renderer cannot drift. Current types: `hero`,
`richText`, `cards`, `stats`, `faq`, `cta`. Adding a type = add a schema,
a default, a form case, and a render case.

**Lifecycle.** DRAFT → SCHEDULED → PUBLISHED → ARCHIVED. Scheduled pages
go live lazily: the first request after `scheduledAt` flips them to
PUBLISHED (no cron needed). Drafts are visible to signed-in team members
at `/{slug}?preview=1` with a warning banner.

**Versions.** Every save writes an immutable `PageVersion` snapshot
(content + SEO). Restoring copies a snapshot onto the page and records
that as a *new* version — history is never rewritten.

**Public rendering.** `app/(site)/[slug]/page.tsx` renders published
pages with brand-styled sections, `generateMetadata` (title, description,
canonical, OG, Twitter, noindex), and JSON-LD: BreadcrumbList always,
FAQPage auto-generated from FAQ sections, plus optional custom schema
stored on the page. `sitemap.xml` includes published, indexable pages.

## Field-level RBAC (verified)

| Action                    | SUPER_ADMIN | DEVELOPER | TESTER | SEO_MANAGER |
| ------------------------- | :---------: | :-------: | :----: | :---------: |
| View pages list/editor    | ✓           | ✓         | ✓      | ✓           |
| Create / clone / delete   | ✓           | ✓         |        |             |
| Edit title/slug/sections  | ✓           | ✓         |        |             |
| Edit SEO fields           | ✓           |           |        | ✓           |
| Publish/schedule/archive  | ✓           |           |        |             |
| Restore versions          | ✓           | ✓         |        |             |

A single PATCH payload is split into content vs. SEO keys and each group
is permission-checked independently.

## API

| Method | Path                          | Permission     |
| ------ | ----------------------------- | -------------- |
| GET    | /api/pages                    | pages.view     |
| POST   | /api/pages                    | pages.create   |
| GET    | /api/pages/:id                | pages.view     |
| PATCH  | /api/pages/:id                | pages.edit and/or seo.manage (field-split) |
| DELETE | /api/pages/:id                | pages.edit (blocked while PUBLISHED) |
| POST   | /api/pages/:id/publish        | pages.publish — `{action: publish\|unpublish\|schedule\|archive\|restore, scheduledAt?}` |
| POST   | /api/pages/:id/clone          | pages.create   |
| GET    | /api/pages/:id/versions       | pages.view     |
| POST   | /api/pages/:id/versions       | pages.edit — `{version}` restores |

Slugs: lowercase kebab, unique, reserved list blocks `admin`, `api`,
`work`, `videos`, etc. All mutations are audit-logged.

## Admin UI

- `/admin/pages` — list with status badges, create (auto-slug), clone,
  preview, publish/unpublish quick actions.
- `/admin/pages/:id` — editor with Content / SEO / Versions tabs:
  reorderable section cards with per-type forms, SEO fields with length
  hints, version list with one-click restore. Toolbar adapts to status
  and role.

## Seeded example

`/digital-marketing-services` — published page using all six section
types; re-run `npm run db:seed` to recreate it.

## Deferred to later phases

Workflow states with comments (Phase 3), media library & image pickers
for sections (Phase 4), rich-text editor upgrade (currently
paragraph-per-blank-line), drag-handle reordering (currently up/down
buttons), background image/video per section.
