# Production deploy — digisutrasolutions.com

Target: the shared VPS `srv1773341` (Ubuntu 24.04), which already runs Caddy,
n8n, aigrowth, ollama and two Postgres containers. Caddy owns :80/:443 and
terminates TLS; Cloudflare sits in front; DNS already points at the box; the
database is seeded from the current local content.

Run every command **on the server** unless a step says otherwise. Because the
box is shared, every step below is written to avoid touching anything that is
already running.

---

## 0. Survey the server first

Nothing here changes anything — it answers "what is already here, and which
port is free".

```bash
{ echo "== OS =="; cat /etc/os-release | head -2; \
  echo "== DOCKER =="; docker --version 2>/dev/null || echo "docker NOT installed"; \
  docker compose version 2>/dev/null || echo "compose plugin NOT installed"; \
  echo "== RUNNING CONTAINERS =="; docker ps --format '{{.Names}}\t{{.Ports}}' 2>/dev/null; \
  echo "== LISTENING PORTS =="; ss -ltnp | awk '{print $4, $6}' | sort -u; \
  echo "== WEB SERVER =="; nginx -v 2>&1; systemctl is-active nginx apache2 2>/dev/null; \
  echo "== EXISTING VHOSTS =="; ls /etc/nginx/sites-enabled/ 2>/dev/null; \
  echo "== CERTS =="; certbot certificates 2>/dev/null | grep -E "Certificate Name|Domains" ; \
  echo "== DISK/MEM =="; df -h / | tail -1; free -h | head -2; } 1>&2
```

On this box the survey already told us: Caddy holds :80/:443, and the app needs
**no host port at all** — it joins Caddy's network `docker-setup_default` and is
reached by container name.

---

## 1. Export the current content (on YOUR machine, not the server)

The production database starts as a copy of the local one, so the rebuilt About
pages, menus, services, testimonials and banner links come across intact.

```bash
cd "D:/Claude Dev/digisutra" && "D:/Claude Dev/pgsql/bin/pg_dump.exe" --dbname="postgresql://postgres:PASSWORD@localhost:5433/digisutra_cms" --no-owner --no-privileges --format=custom --file=digisutra-prod-seed.dump
```

Then copy it plus the uploaded media to the server:

```bash
scp digisutra-prod-seed.dump user@SERVER:/tmp/
scp -r public/uploads user@SERVER:/tmp/uploads
```

> The database stores **paths** to uploaded images, not the bytes. Restoring the
> dump without the `uploads` folder gives you intact rows pointing at missing
> files — the exact broken-thumbnail symptom seen on staging.

---

## 2. Install Docker — ALREADY PRESENT, SKIP

Docker 29.6.0 and Compose v5.1.4 are installed on this box. Left here only for
rebuilding on a fresh machine.

```bash
{ curl -fsSL https://get.docker.com | sh; systemctl enable --now docker; docker compose version; } 1>&2
```

---

## 3. Clone and configure

```bash
{ mkdir -p /root/digisutrasolutions.com && cd /root/digisutrasolutions.com; \
  git clone https://github.com/digisutrasolution/digisutrasolutions-new.git . ; \
  cp deploy/production/env.production.example .env; } 1>&2
```

Generate the secrets and point the app at Caddy's network:

```bash
{ cd /root/digisutrasolutions.com; \
  sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$(openssl rand -hex 24)|" .env; \
  sed -i "s|^AUTH_SECRET=.*|AUTH_SECRET=$(openssl rand -hex 48)|" .env; \
  sed -i "s|^CADDY_NETWORK=.*|CADDY_NETWORK=docker-setup_default|" .env; \
  grep -E '^(SITE_URL|SITE_NOINDEX|CADDY_NETWORK|COMPOSE_PROJECT_NAME)=' .env; } 1>&2
```

The printout must show `SITE_NOINDEX=0` (staging uses 1 — copying it here would
launch a site Google is told never to index) and
`CADDY_NETWORK=docker-setup_default`.

---

## 4. Build and start

```bash
{ cd /root/digisutrasolutions.com; \
  docker compose -f deploy/production/docker-compose.prod.yml --env-file .env up -d --build; \
  docker compose -f deploy/production/docker-compose.prod.yml --env-file .env ps; } 1>&2
```

---

## 5. Restore the content

```bash
{ cd /root/digisutrasolutions.com; \
  CID=$(docker compose -f deploy/production/docker-compose.prod.yml --env-file .env ps -q db); \
  docker cp /tmp/digisutra-prod-seed.dump "$CID":/tmp/seed.dump; \
  docker exec "$CID" pg_restore -U digisutra -d digisutra_cms --clean --if-exists --no-owner /tmp/seed.dump; \
  APP=$(docker compose -f deploy/production/docker-compose.prod.yml --env-file .env ps -q app); \
  docker cp /tmp/uploads/. "$APP":/app/public/uploads/; \
  docker compose -f deploy/production/docker-compose.prod.yml --env-file .env restart app; } 1>&2
```

Sanity check the app answers before wiring Caddy. It publishes no host port, so
ask from inside Caddy's own network by container name:

```bash
{ docker run --rm --network docker-setup_default curlimages/curl:latest \
    -s -o /dev/null -w "app: %{http_code}\n" http://digisutra-prod-app-1:3000/; } 1>&2
```

---

## 6. Caddy (NOT nginx)

> **Do not install nginx on this server.** Ports 80 and 443 belong to the
> running `docker-setup-caddy-1` container, which serves n8n, aigrowth and the
> rest. Installing nginx would fight it for those ports and take every existing
> site down. There is also nothing for certbot to do — Caddy issues and renews
> certificates itself.

Known values on this box:

| thing | value |
| --- | --- |
| Caddyfile | `/root/docker-setup/Caddyfile` |
| Caddy compose dir | `/root/docker-setup` |
| Docker network | `docker-setup_default` |

Back the Caddyfile up, append the site block, then **reload** (a reload cannot
drop the other sites; a restart briefly would):

```bash
{ cp /root/docker-setup/Caddyfile /root/docker-setup/Caddyfile.bak.$(date +%F-%H%M); \
  cat /root/digisutrasolutions.com/deploy/production/caddy-digisutrasolutions.conf >> /root/docker-setup/Caddyfile; \
  docker exec docker-setup-caddy-1 caddy validate --config /etc/caddy/Caddyfile && \
  docker exec docker-setup-caddy-1 caddy reload --config /etc/caddy/Caddyfile && \
  echo "caddy reloaded"; } 1>&2
```

If `caddy validate` fails, nothing has been applied yet — restore with
`cp /root/docker-setup/Caddyfile.bak.* /root/docker-setup/Caddyfile` and send me
the error.

Cloudflare must be on **SSL/TLS → Full (strict)**. "Flexible" would make
Cloudflare talk HTTP to the origin while telling browsers the connection is
secure, and the app's HTTPS redirects would loop.

---

## 7. Post-launch checks

```bash
{ echo "== live =="; curl -sI https://digisutrasolutions.com | head -3; \
  echo "== INDEXABLE? (must NOT say noindex) =="; \
  curl -s https://digisutrasolutions.com | grep -o '<meta name="robots"[^>]*>' | head -1; \
  echo "== canonical (must be the real domain, not vercel) =="; \
  curl -s https://digisutrasolutions.com | grep -o '<link rel="canonical"[^>]*>' | head -1; \
  echo "== robots.txt =="; curl -s https://digisutrasolutions.com/robots.txt | head -5; \
  echo "== real visitor IP reaching the app =="; \
  docker compose -f /root/digisutrasolutions.com/deploy/production/docker-compose.prod.yml --env-file /root/digisutrasolutions.com/.env logs --tail=5 app; } 1>&2
```

**Then, immediately:**

1. **Change the seeded CMS passwords.** The four seeded accounts
   (admin/developer/tester/seo) have passwords documented in `docs/CMS-PHASE1.md`
   **in the public GitHub repo**. Until they are changed, anyone who reads the
   repo can log into the live admin. Log in at
   `https://digisutrasolutions.com/admin` and change all four.
2. **Republish the menus** — the site renders a published snapshot, not the
   draft rows. Admin → Menus → each location → Publish.
3. Submit `https://digisutrasolutions.com/sitemap.xml` in Search Console.

---

## Updating later

```bash
{ cd /root/digisutrasolutions.com && git pull && \
  docker compose -f deploy/production/docker-compose.prod.yml --env-file .env up -d --build; } 1>&2
```

Content scripts (`update-about-page.mjs`, `update-about-subpages.mjs`) are only
needed if you want to reset that page's content back to the scripted version —
they **overwrite** the CMS copy, so avoid running them casually in production.

## Backups

```bash
{ cd /root/digisutrasolutions.com; \
  CID=$(docker compose -f deploy/production/docker-compose.prod.yml --env-file .env ps -q db); \
  docker exec "$CID" pg_dump -U digisutra -Fc digisutra_cms > /root/digisutra-$(date +%F).dump; \
  docker run --rm -v digisutra-prod_uploads:/u -v /root:/b alpine tar czf /b/uploads-$(date +%F).tgz -C /u . ; \
  ls -lh /root/digisutra-*.dump /root/uploads-*.tgz | tail -4; } 1>&2
```

Both matter: the dump alone restores rows pointing at images that no longer exist.
