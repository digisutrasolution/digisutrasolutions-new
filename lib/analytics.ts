import { z } from "zod";
import { db } from "@/lib/db";

/**
 * Third-party measurement tags, all admin-managed in /admin/settings.
 *
 * Nothing is hardcoded and nothing loads unless an ID is set, so the site
 * ships with zero third-party requests by default — which is also why the
 * first-party /api/track pageview counter stays: it works with no vendor,
 * no cookie and no consent prompt.
 *
 * Consent: Google tags are initialised with Consent Mode v2 set to denied
 * for ad and analytics storage. That keeps them cookieless until consent
 * is granted, which is the safe default for UK/EU visitors. Meta Pixel and
 * Clarity have no equivalent switch, so enabling those without a consent
 * banner is a compliance decision the owner has to make deliberately.
 */

/* Vendor ID shapes, so a typo cannot silently break every page. */
const GA4 = /^G-[A-Z0-9]{4,}$/;
const GTM = /^GTM-[A-Z0-9]{4,}$/;
const PIXEL = /^[0-9]{10,20}$/;
const CLARITY = /^[a-z0-9]{6,20}$/;

const idField = (re: RegExp, hint: string) =>
  z
    .string()
    .trim()
    .max(40)
    .refine((v) => v === "" || re.test(v), { message: hint })
    .default("");

export const AnalyticsSchema = z.object({
  ga4Id: idField(GA4, "GA4 IDs look like G-XXXXXXX."),
  gtmId: idField(GTM, "GTM IDs look like GTM-XXXXXXX."),
  metaPixelId: idField(PIXEL, "Meta Pixel IDs are 10–20 digits."),
  clarityId: idField(CLARITY, "Clarity IDs are lowercase letters and digits."),
  /** Off until the owner has a consent banner or has decided they need none. */
  enabled: z.boolean().default(false),
});

export type AnalyticsSettings = z.infer<typeof AnalyticsSchema>;

export const DEFAULT_ANALYTICS: AnalyticsSettings = {
  ga4Id: "",
  gtmId: "",
  metaPixelId: "",
  clarityId: "",
  enabled: false,
};

export async function getAnalytics(): Promise<AnalyticsSettings> {
  try {
    const row = await db.siteSetting.findUnique({ where: { key: "analytics" } });
    const parsed = AnalyticsSchema.safeParse(row?.value);
    if (parsed.success) return parsed.data;
  } catch {
    /* DB down → no tags, never a broken page */
  }
  return DEFAULT_ANALYTICS;
}

/** True when at least one tag would actually load. */
export function hasAnyTag(a: AnalyticsSettings): boolean {
  return (
    a.enabled &&
    Boolean(a.ga4Id || a.gtmId || a.metaPixelId || a.clarityId)
  );
}
