# DigiSutra Solutions — Website & CMS Platform

Production website + enterprise CMS for DigiSutra Solutions (digital
marketing & software development agency). Public marketing site with an
editorial design system, and a role-based content platform under `/admin`.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript ·
Tailwind CSS v4 · framer-motion · Prisma 6 · PostgreSQL 17 ·
Anthropic SDK (AI assistant) · sharp (image pipeline) · Vercel Blob (prod media)

## What's inside

| Area | Docs |
| --- | --- |
| Auth (JWT + refresh rotation), RBAC (4 roles), users, audit log | [docs/CMS-PHASE1.md](docs/CMS-PHASE1.md) |
| Page CMS: section blocks, draft/schedule/publish, versioning, SEO + schema | [docs/CMS-PHASE2.md](docs/CMS-PHASE2.md) |
| Editorial workflow: Draft→Testing→SEO→Approval, comments, bugs, notifications | [docs/CMS-PHASE3.md](docs/CMS-PHASE3.md) |
| Blog, media library (WebP pipeline), form builder + CSV export, search | [docs/CMS-PHASE4.md](docs/CMS-PHASE4.md) |
| AI content assistant, video library, first-party analytics, redirects | [docs/CMS-PHASE5.md](docs/CMS-PHASE5.md) |

Roles: **Super Admin** (everything, publishing), **Developer** (build pages,
forms, submit for testing), **Tester** (test, bug reports, pass/fail),
**SEO Manager** (content, SEO fields, blog, redirects). The full permission
matrix lives in `lib/auth/rbac.ts`.

## Local development

Prereqs: Node 20+, the portable PostgreSQL at `../pgsql` (already set up —
see Phase 1 docs if rebuilding).

```bash
npm install            # also runs prisma generate
npm run db:start       # start PostgreSQL (after every reboot)
npx prisma migrate dev # apply schema (first run)
npm run db:seed        # role accounts + sample content
npm run dev            # http://localhost:3000  (preview config uses 3100)
```

Sign in at `/admin/login` — dev accounts and passwords are listed in
[docs/CMS-PHASE1.md](docs/CMS-PHASE1.md). **Change them before any deploy.**

Environment variables: copy `.env.example` → `.env`. Everything except
`DATABASE_URL` and `AUTH_SECRET` is optional in development (AI assistant
and email fan-out activate when their keys are present).

## Deploying to Vercel

1. **Database** — create a managed Postgres (Neon free tier works). Set
   `DATABASE_URL` in Vercel env.
2. **Migrations** — set the Vercel *Build Command* to:
   `npm run deploy:migrate && npm run build`
3. **Media** — create a Blob store in the Vercel dashboard; it injects
   `BLOB_READ_WRITE_TOKEN` automatically. Uploads switch from
   `public/uploads` to Blob with no code change.
4. **Secrets** — set `AUTH_SECRET` (fresh 48-byte hex), `ANTHROPIC_API_KEY`
   (AI assistant), `RESEND_API_KEY` (+ optional `CONTACT_TO_EMAIL`,
   `CONTACT_FROM_EMAIL`).
5. **Seed** — run `npx prisma db seed` once against the production DB
   (locally with prod `DATABASE_URL`), then immediately change every
   seeded password from `/admin/users`.
6. Deploy: `vercel --prod` (or connect the Git repo).

## Pre-launch checklist

- [ ] All seeded passwords changed; unused role accounts deactivated
- [ ] `AUTH_SECRET` is production-grade (not the dev placeholder)
- [ ] Real logo file in the navbar (`components/Navbar.tsx`)
- [ ] Placeholder clients/stats/pricing in `lib/data.ts` replaced
- [ ] Real showreel video replacing `public/videos/showreel.mp4`
- [ ] `RESEND_API_KEY` verified (send a test contact-form submission)
- [ ] Sitemap/robots URLs updated if the domain changes from
      digisutra-alpha.vercel.app (search `SITE_URL` and `app/sitemap.ts`)

## Security notes

Headers (nosniff, frame-options, HSTS, permissions-policy, admin
noindex) ship from `next.config.ts`. Auth uses httpOnly cookies, bcrypt,
rotating hashed refresh tokens, and login rate limiting. All mutations
are zod-validated, permission-checked server-side, and audit-logged.
Known post-launch hardening items: strict CSP (needs a nonce pipeline),
Upstash/Redis rate limiting for multi-instance deployments, reCAPTCHA on
public forms.
