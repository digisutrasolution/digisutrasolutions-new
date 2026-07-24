# Production deploy — digisutrasolutions.com

Target: a dedicated VPS that already hosts other apps, nginx + Let's Encrypt at
the origin, Cloudflare in front, DNS already pointing at the box, and the
database seeded from the current local content.

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

Pick an `APP_PORT` that does **not** appear in the listening-ports list
(default in the example env is `3200`).

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

## 2. Install Docker (skip if step 0 showed it)

```bash
{ curl -fsSL https://get.docker.com | sh; systemctl enable --now docker; docker compose version; } 1>&2
```

---

## 3. Clone and configure

```bash
{ mkdir -p /opt/digisutra && cd /opt/digisutra; \
  git clone https://github.com/digisutrasolution/digisutrasolutions-new.git . ; \
  cp deploy/production/env.production.example .env; } 1>&2
```

Now edit `.env` and set `DB_PASSWORD`, `AUTH_SECRET` and `APP_PORT`:

```bash
{ cd /opt/digisutra; \
  sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$(openssl rand -hex 24)|" .env; \
  sed -i "s|^AUTH_SECRET=.*|AUTH_SECRET=$(openssl rand -hex 48)|" .env; \
  grep -E '^(SITE_URL|SITE_NOINDEX|APP_PORT|COMPOSE_PROJECT_NAME)=' .env; } 1>&2
```

Confirm the printout shows `SITE_NOINDEX=0` and the port you chose.

---

## 4. Build and start

```bash
{ cd /opt/digisutra; \
  docker compose -f deploy/production/docker-compose.prod.yml --env-file .env up -d --build; \
  docker compose -f deploy/production/docker-compose.prod.yml --env-file .env ps; } 1>&2
```

---

## 5. Restore the content

```bash
{ cd /opt/digisutra; \
  CID=$(docker compose -f deploy/production/docker-compose.prod.yml --env-file .env ps -q db); \
  docker cp /tmp/digisutra-prod-seed.dump "$CID":/tmp/seed.dump; \
  docker exec "$CID" pg_restore -U digisutra -d digisutra_cms --clean --if-exists --no-owner /tmp/seed.dump; \
  APP=$(docker compose -f deploy/production/docker-compose.prod.yml --env-file .env ps -q app); \
  docker cp /tmp/uploads/. "$APP":/app/public/uploads/; \
  docker compose -f deploy/production/docker-compose.prod.yml --env-file .env restart app; } 1>&2
```

Sanity check the app answers locally before wiring nginx:

```bash
{ curl -s -o /dev/null -w "local app: %{http_code}\n" http://127.0.0.1:3200/; } 1>&2
```

---

## 6. nginx + certificate

```bash
{ cp /opt/digisutra/deploy/production/nginx-digisutrasolutions.conf \
     /etc/nginx/sites-available/digisutrasolutions.com; \
  ln -sf /etc/nginx/sites-available/digisutrasolutions.com /etc/nginx/sites-enabled/; \
  nginx -t; } 1>&2
```

`nginx -t` will fail until the certificate exists — that is expected. Issue it:

> **Cloudflare gotcha:** while the DNS record is proxied (orange cloud),
> certbot's HTTP-01 challenge is answered by Cloudflare, not your server, and
> fails. Either grey-cloud the record for five minutes, or use DNS-01.

```bash
{ certbot certonly --webroot -w /var/www/html \
    -d digisutrasolutions.com -d www.digisutrasolutions.com; \
  nginx -t && systemctl reload nginx; } 1>&2
```

Re-enable the orange cloud afterwards and set Cloudflare **SSL/TLS → Full
(strict)**. "Flexible" would make Cloudflare talk HTTP to your origin while
telling browsers the connection is secure, and the app would build `http://`
redirect loops.

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
  docker compose -f /opt/digisutra/deploy/production/docker-compose.prod.yml --env-file /opt/digisutra/.env logs --tail=5 app; } 1>&2
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
{ cd /opt/digisutra && git pull && \
  docker compose -f deploy/production/docker-compose.prod.yml --env-file .env up -d --build; } 1>&2
```

Content scripts (`update-about-page.mjs`, `update-about-subpages.mjs`) are only
needed if you want to reset that page's content back to the scripted version —
they **overwrite** the CMS copy, so avoid running them casually in production.

## Backups

```bash
{ cd /opt/digisutra; \
  CID=$(docker compose -f deploy/production/docker-compose.prod.yml --env-file .env ps -q db); \
  docker exec "$CID" pg_dump -U digisutra -Fc digisutra_cms > /root/digisutra-$(date +%F).dump; \
  docker run --rm -v digisutra-prod_uploads:/u -v /root:/b alpine tar czf /b/uploads-$(date +%F).tgz -C /u . ; \
  ls -lh /root/digisutra-*.dump /root/uploads-*.tgz | tail -4; } 1>&2
```

Both matter: the dump alone restores rows pointing at images that no longer exist.
