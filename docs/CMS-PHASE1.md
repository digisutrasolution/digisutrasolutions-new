# DigiSutra CMS — Phase 1: Foundation

Auth, RBAC, user management, and audit logging for the CMS platform.
Public marketing site is untouched; everything lives under `/admin`.

## Architecture

Next.js 16 full-stack (App Router). Route handlers are the API layer,
Prisma 6 + PostgreSQL 17 the data layer. No separate backend process.

```
app/
  (site)/            public marketing site (unchanged pages)
  admin/
    login/           sign-in screen (no admin chrome)
    (panel)/         authenticated panel: dashboard, users, audit
  api/
    auth/            login · refresh · logout
    users/           user CRUD (Super Admin)
    contact/         public contact form (Phase 0)
components/admin/    AdminShell, LoginForm, UsersManager
lib/
  auth/              password (bcrypt) · tokens (jose JWT) · session ·
                     rbac (permission map) · guards (route-handler)
  db.ts              Prisma singleton
  audit.ts           fire-and-forget audit writer
  rate-limit.ts      in-memory sliding window (swap for Upstash in prod)
proxy.ts             edge guard for /admin (Next 16 middleware)
prisma/              schema · migrations · seed
```

## Local development

The dev database is a portable PostgreSQL 17.5 at `D:\Claude Dev\pgsql`
(port **5433**, superuser `postgres` / `digisutra_dev`).

```bash
npm run db:start    # start PostgreSQL (after reboot)
npm run dev         # start Next.js
npm run db:migrate  # apply schema changes
npm run db:seed     # (re)create role accounts
npm run db:studio   # browse data
npm run db:stop
```

`.env` holds `DATABASE_URL` and `AUTH_SECRET`. For production generate a
fresh secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

## Seeded accounts (DEV ONLY — change before deploy)

| Role        | Email                    | Password          |
| ----------- | ------------------------ | ----------------- |
| Super Admin | admin@digisutra.com      | Admin@digisutra1  |
| Developer   | developer@digisutra.com  | Dev@digisutra1    |
| Tester      | tester@digisutra.com     | Test@digisutra1   |
| SEO Manager | seo@digisutra.com        | Seo@digisutra1    |

## Auth model

- **Access token**: HS256 JWT, 15 min, `ds_access` httpOnly cookie.
- **Refresh token**: 48-byte random, SHA-256 hash stored in DB, 30 days,
  `ds_refresh` httpOnly cookie scoped to `/api/auth`. Rotated on every
  refresh; presented-token revoked (replay protection).
- **Silent renewal**: AdminShell refreshes every 10 min; the login page
  attempts a refresh on mount so an expired access token never forces a
  re-login while the refresh token is valid.
- **Kill switches**: deactivating a user or changing their password
  revokes all their refresh tokens; `getCurrentUser` re-checks `isActive`
  on every request, so a disabled user is cut off within one request.
- `proxy.ts` does optimistic JWT verification at the edge; authoritative
  checks (DB user state, permissions) run in layouts and handlers.

## RBAC

Central permission map in `lib/auth/rbac.ts`; UI and API both consult it.

| Permission     | SUPER_ADMIN | DEVELOPER | TESTER | SEO_MANAGER |
| -------------- | :---------: | :-------: | :----: | :---------: |
| users.manage   | ✓           |           |        |             |
| audit.read     | ✓           |           |        |             |
| settings.manage| ✓           |           |        |             |
| pages.create   | ✓           | ✓         |        |             |
| pages.publish  | ✓           |           |        |             |
| testing.review | ✓           |           | ✓      |             |
| seo.manage     | ✓           |           |        | ✓           |
| media.upload   | ✓           | ✓         |        | ✓           |

Phase 2+ adds permissions here without touching call sites.

## API

All responses: `{ ok: boolean, ... }`. Errors carry `error: string`.

| Method | Path              | Auth            | Notes                              |
| ------ | ----------------- | --------------- | ---------------------------------- |
| POST   | /api/auth/login   | public (10/10min/IP) | sets cookies, audits success+fail |
| POST   | /api/auth/refresh | refresh cookie  | rotates token pair                 |
| POST   | /api/auth/logout  | any             | revokes refresh, clears cookies    |
| GET    | /api/users        | users.manage    | list                               |
| POST   | /api/users        | users.manage    | create (zod-validated)             |
| PATCH  | /api/users/:id    | users.manage    | name/role/active/password          |
| DELETE | /api/users/:id    | users.manage    | blocked: self, last Super Admin    |

## Security checklist (Phase 1)

- [x] bcrypt (12 rounds) password hashing
- [x] httpOnly, SameSite=Lax cookies; Secure in production
- [x] Refresh-token rotation with replay revocation
- [x] Login rate limiting + uniform invalid-credentials response
- [x] Zod validation on every mutating endpoint
- [x] RBAC enforced server-side (proxy + layout + handler)
- [x] Last-Super-Admin and self-delete protections
- [x] Audit log on auth events and user CRUD
- [ ] Upstash/Redis rate limiting (needed for multi-instance prod)
- [ ] CSP / security headers pass (Phase 2)
- [ ] Password reset via email (needs RESEND_API_KEY)

## Next phases

2. Content CMS — pages as section blocks, draft/publish/schedule,
   versioning, per-page SEO + schema, DB-driven public pages.
3. Workflow — Draft→Testing→SEO→Approval state machine, comments,
   bug reports, notifications (in-app + email), full audit coverage.
4. Blog, media library (upload/WebP/alt), form builder, global search.
5. AI assistant (Claude API), video manager, analytics dashboard.
