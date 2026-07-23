# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run db:start       # start portable PostgreSQL at ../pgsql, port 5433 — required after every reboot
npm run dev            # dev server (the owner usually runs it on port 3100: next dev -- --port 3100)
npm run build          # production build (Turbopack) — run before considering any change done
npm run lint           # eslint
npm run db:migrate     # prisma migrate dev
npm run db:seed        # CAUTION: seed.ts lags behind content added later via admin/DB — reseeding clobbers it
npm run db:studio      # inspect the DB
```

There is no test suite; verification is `npm run build` + `npm run lint` + exercising pages/APIs against the running dev server. If a dev server is already listening on port 3100 it belongs to the owner — verify against it with curl/scripts, don't start a competing one.

On this Windows machine, never regex-edit UTF-8 source with PowerShell 5.1 (`Get-Content`/`-replace` mojibakes em-dashes and `₹`); use a Node script for scripted edits.

## Architecture

Two apps in one Next.js 16 App Router project, split by route group:

- **`app/(site)/`** — public marketing site + blog. Chrome (Navbar/Footer/WhatsApp FAB) comes from the group layout; `<main>` gets `paddingTop: calc(var(--topbar-h) + 68px)` because the announcement bar + header are fixed.
- **`app/admin/`** — the CMS panel (own shell, dark mode via `.dark` class), guarded by `proxy.ts` at the edge (Next 16 renamed middleware → proxy) plus per-route server checks.
- **`app/api/`** — all mutations are zod-validated, permission-checked server-side via `lib/auth/guards.ts`, and audit-logged (`lib/audit.ts`).

Key subsystems (each spans several files — read these before touching the area):

- **RBAC**: permission map in `lib/auth/rbac.ts` (4 roles: super admin / developer / tester / SEO). Auth is 15-min JWT access + rotating hashed refresh cookies (`lib/auth/tokens.ts`, `session.ts`).
- **Page CMS**: section blocks are a zod discriminated union in `lib/cms/sections.ts` shared by the admin editor forms AND the public renderer (`components/sections/SectionRenderer.tsx`) — extend the union and both sides follow. Lifecycle + versioning in `lib/cms/pages.ts`; editorial workflow (Draft→Testing→SEO→Approval, publish gate) in `lib/cms/workflow.ts`. Content edits auto-reset workflow stage. Public CMS pages render via `app/(site)/[slug]` — single-segment slugs only.
- **Blog**: DB-driven (`BlogPost`). `lib/blog.ts` holds category-hub metadata (db name ↔ slug ↔ label) and derives the article TOC and "Key takeaways" from the body — takeaways are the first sentence under each `##` heading, which works because post bodies are written answer-first. Body format is strictly: blank-line-separated paragraphs + `## `/`### ` headings, no other markdown.
- **Home page sections**: composed in `app/(site)/page.tsx` from `components/*.tsx`, content in `lib/data.ts`. Several components on disk are intentionally unmounted (Stats, Services, WhyUs, Testimonials, Pricing, Technologies, Contact, WorkSection, FeaturedVideos) — superseded designs, keep them.
- **Media**: `lib/storage.ts` is dual-backend — Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set, else `public/uploads`.
- **AI assistant**: `lib/ai.ts` (server, Anthropic SDK) / `lib/ai-kinds.ts` (client-safe prompt metadata). Returns 503 cleanly without `ANTHROPIC_API_KEY`.
- **Analytics**: first-party, cookie-less — `TrackPageview` beacons to `/api/track` → `PageView` rows; "Most read" on the blog index ranks by them.

## Conventions and gotchas

- **Subpath deploys (critical)**: `SITE_URL` drives `basePath` in `next.config.ts`. Next prefixes its own assets but NOT `<img>`/`next/image` srcs, video posters, or hand-built fetch/href URLs. Route every such path through `withBase()` (`lib/base-path.ts`); use `absUrl()` (`lib/site.ts`) for og:image and JSON-LD. Never write a bare `src={coverUrl}`. Verify: build with a subpath `SITE_URL`, `next start`, assert no unprefixed `<img src="/`.
- **Design system**: brand orange `#F26419` on stone-900/cream `#FFFBF7`; sections use `mx-auto max-w-[1280px] px-6` (aligned to the header — the owner checks edge alignment), reading columns `max-w-3xl`; headings `font-display` with a `font-serif-accent` italic orange span; Roboto Condensed only via `.font-condensed` (header/footer). Section rhythm: `pt-20 sm:pt-24`, last section on a page carries the bottom padding; on standalone pages keep top/bottom padding equal.
- **Animation**: entrances use the `Reveal` wrapper; bespoke keyframes live in `globals.css` and any hidden initial state MUST be reset under `prefers-reduced-motion` or content goes invisible. Full-bleed transformed bands need an `overflow-x-clip` wrapper (document-overflow bug). Marquees: the animation half (-50%) must outspan the widest viewport — hence 8× chip copies.
- **Icons**: this lucide-react version has NO brand icons (`Linkedin`, `Twitter` don't exist — verify before importing); use text glyphs like Footer does.
- **FAQ data**: `FAQS` in `lib/data.ts` is `{q, lead, rest}` — `lead` is the bolded answer-first fact and JSON-LD joins `lead + rest`; card icons in `components/Faq.tsx` are positional, keep in sync.
- **Contact API**: two honeypot fields — legacy `website` and `hp`. Don't repurpose `website` as a real field.
- **Content scope**: the agency does NOT offer ERP, HRMS or POS — never reintroduce those. It DOES offer (and advertises in the nav/footer): SEO + AI Search Optimization (AEO/GEO), PPC/performance marketing, social, content, email & SMS marketing, organic lead generation, CRM & lead management, website + custom web app development, mobile app development, e-commerce development, AI automation & agents, branding/UI-UX, and maintenance. (Owner confirmed 2026-07: CRM-as-lead-management and mobile apps are in scope; only ERP *software* development stays out.)
- **Verifying SSR with curl**: strip `<script>` tags before counting text occurrences — the RSC flight payload duplicates all server-component text.
- Layout title template appends "| DigiSutra Solutions" — don't include the brand in per-page `seoTitle`.

## Deployment

Two targets (see `README.md` for Vercel; `deploy/` for the office server):

- **Office staging (live)**: Docker Compose on the Ubuntu 18.04 pbx server at `/home/html/development/inhouse/digisutrasolutions.com`, app on `127.0.0.1:3105` behind an Apache `ProxyPass` under `https://pbx.iqinfotech.co.in/inhouse/digisutrasolutions.com/` with `SITE_NOINDEX=1`. Update = `git pull && docker compose up -d --build`. The Dockerfile must keep `npm ci --include=dev` (`NODE_ENV=production` is set before install and would otherwise skip build-time deps).
- Seeded admin accounts/passwords are documented in `docs/CMS-PHASE1.md` — they must be changed on any deployed instance.
