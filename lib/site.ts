/* Canonical site origin for SEO surfaces (metadata, JSON-LD, sitemap, RSS).
   Set SITE_URL per environment; SITE_NOINDEX=1 keeps staging out of Google. */
export const SITE_URL = (
  process.env.SITE_URL ?? "https://digisutra-alpha.vercel.app"
).replace(/\/+$/, "");

export const NOINDEX = process.env.SITE_NOINDEX === "1";

/** Absolute URL for SEO surfaces (og:image, JSON-LD) — includes basePath
    because SITE_URL carries it on subpath deploys. */
export const absUrl = (path: string) =>
  path.startsWith("/") ? `${SITE_URL}${path}` : path;
