/* Canonical site origin for SEO surfaces (metadata, JSON-LD, sitemap, RSS).
   Set SITE_URL per environment; SITE_NOINDEX=1 keeps staging out of Google. */
export const SITE_URL = (
  process.env.SITE_URL ?? "https://digisutra-alpha.vercel.app"
).replace(/\/+$/, "");

export const NOINDEX = process.env.SITE_NOINDEX === "1";
