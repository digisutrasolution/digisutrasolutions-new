import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";

/**
 * Visitor country + the currency to show them by default.
 *
 * The country comes from the edge, never from a client-side lookup: this
 * deployment sits behind Cloudflare, which stamps `CF-IPCountry` on every
 * request (Caddy forwards it unchanged). `x-vercel-ip-country` is kept as a
 * fallback so the Vercel preview deployments behave the same way.
 */
export type Currency = "INR" | "USD";

export function visitorCountry(h: ReadonlyHeaders): string | null {
  const raw =
    h.get("cf-ipcountry") ?? h.get("x-vercel-ip-country") ?? null;
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  // Cloudflare sends XX for anonymised/unknown and T1 for Tor.
  if (!/^[A-Z]{2}$/.test(code) || code === "XX" || code === "T1") return null;
  return code;
}

/**
 * India sees rupees; everyone else sees dollars.
 *
 * An unknown country falls back to INR rather than USD on purpose: the
 * header is missing in local dev and on any request that skips the edge, and
 * the rupee figures are the complete, authoritative set — the USD ones are
 * optional and may not be filled in yet. Guessing USD there would risk
 * showing a visitor an empty price.
 */
export function currencyForCountry(country: string | null): Currency {
  return country === "IN" || country === null ? "INR" : "USD";
}
