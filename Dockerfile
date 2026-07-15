# DigiSutra site + CMS. Full (non-standalone) image: keeps the prisma CLI
# available so the container can run `migrate deploy` on boot.
FROM node:22-bookworm-slim

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production

# OpenSSL is required by Prisma's query engine on slim images.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Install deps first for layer caching. postinstall runs `prisma generate`,
# so the schema must be present before npm ci.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .

# SEO surfaces bake the canonical origin at build time.
ARG SITE_URL
ARG SITE_NOINDEX=0
ENV SITE_URL=$SITE_URL SITE_NOINDEX=$SITE_NOINDEX

RUN npm run build

EXPOSE 3000
# Apply any pending migrations, then serve.
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
