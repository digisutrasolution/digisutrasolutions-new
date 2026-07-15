# DigiSutra CMS — Phase 5: AI, Video, Analytics, Redirects

The final phase of the enterprise brief.

## AI content assistant

- `POST /api/ai/generate` — permission `ai.use` (Admin, Developer, SEO),
  20 req/10min per user. Kinds: seo_title, meta_description, excerpt,
  blog_outline, blog_post, faq, service_description, cta, alt_text,
  social_caption. Prompts carry DigiSutra brand voice context.
- Built on the official `@anthropic-ai/sdk` → `claude-opus-4-8` with
  adaptive thinking (no sampling params — they 400 on this model).
  **Requires `ANTHROPIC_API_KEY` in `.env`** — without it the endpoint
  returns a clear 503 (verified). Provider auth/rate/API errors map to
  typed responses; refusals surface as errors, never silent.
- Every generation is logged (`AiGeneration`: user, kind, model, sizes)
  for the usage counters, and audit-logged.
- UI: "AI assist" panel in the Blog editor (outline/draft/excerpt/SEO/
  social — inserts into the right field) and the Page editor's SEO tab
  (titles/descriptions/FAQ/CTA). Generated text is always shown editable
  before insertion, per the brief.

## Video management

- `Video` model: YouTube / Vimeo / direct-file, parsed automatically
  from a pasted URL (`lib/cms/videos.ts`); slug, category, description,
  optional duration, featured flag, auto YouTube thumbnail.
- Admin `/admin/videos` (manage: `videos.manage`; browse: all roles):
  add via URL, feature toggle (star), copy-slug, delete.
- Embedding: **Video section** on any CMS page (by slug) — renders a
  lazy iframe (youtube-nocookie / Vimeo player) or native `<video>` for
  files, with **VideoObject JSON-LD** injected on the page (verified).
- **Featured videos section on the home page** (per the brief) —
  renders up to 2 featured videos; hidden when none exist.

## Analytics

- First-party, cookie-less page-view beacon: `TrackPageview` in the
  site layout → `sendBeacon`/`fetch` → `POST /api/track` (rate-limited,
  strips query strings, ignores /admin and /api, stores path + referrer
  host only — no user identifiers).
- `/admin/analytics` (permission `analytics.view`: Admin, SEO): views
  today/7d/30d, daily bar chart (14 days), top pages, top referrers,
  form submissions, AI generation count, published content counts.
- Not a replacement for GA4 — it's the brief's "traffic" dashboard with
  zero third-party scripts and zero consent burden. GA4 can be added
  alongside later.

## Redirects manager

- `Redirect` model: fromPath (unique) → toPath (path or full URL),
  307/308 toggle, active toggle, hit counter.
- Enforced in the dynamic `[slug]` route *before* 404 — covers
  top-level paths that don't match a page (verified: /old-services →
  308 → /digital-marketing-services, hits incremented). Multi-segment
  paths (e.g. /blog/old-post) are not covered by this mechanism yet —
  next.config redirects or the proxy layer would be the upgrade.
- Admin `/admin/redirects` — permission `redirects.manage` (Admin, SEO).

## Verified

Featured video on home with nocookie embed; video section + VideoObject
schema on a CMS page; redirect created, followed and counted; AI 503s
cleanly without a key; tester role 403 on AI/videos/redirects; analytics
page renders live data (Google referrer recorded via beacon test).
Production build: 52 routes clean.

## To activate the AI assistant

Add to `.env` (and Vercel env for production):
```
ANTHROPIC_API_KEY=sk-ant-...
```
No code changes needed — the panels light up immediately.
