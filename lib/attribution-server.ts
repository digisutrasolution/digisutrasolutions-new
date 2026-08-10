import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";

/* Turns the browser's captured attribution into Lead columns.

   One helper rather than the same block copied into /api/leads, /api/contact
   and /api/form-submissions — three intake paths that must agree, or the same
   campaign reports differently depending on which form someone filled in. */

/* Truncate rather than reject.

   Attribution rides along inside the lead payload, so a `.max()` failure here
   would fail the WHOLE submission and lose the enquiry — telemetry must never
   cost a lead. A too-long or wrong-typed value is clipped or dropped, and the
   enquiry still saves. Verified: a 500-char utm_source used to 400 the
   request. */
const str = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.trim().slice(0, max) || undefined : undefined),
    z.string().optional(),
  );

export const AttributionSchema = z.object({
  utmSource: str(200),
  utmMedium: str(200),
  utmCampaign: str(200),
  utmTerm: str(200),
  utmContent: str(200),
  gclid: str(200),
  fbclid: str(200),
  msclkid: str(200),
  referrer: str(300),
  landingPath: str(300),
})
  // A structurally wrong attribution object degrades to nothing, for the same
  // reason: it must not take the enquiry down with it.
  .catch({});

export type AttributionInput = z.infer<typeof AttributionSchema>;

/** The Lead fields to spread into a create(). */
export type AttributionFields = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  gclid: string | null;
  fbclid: string | null;
  msclkid: string | null;
  referrer: string | null;
  landingPath: string | null;
  landingPageId: string | null;
  campaign: string | null;
};

const EMPTY: AttributionFields = {
  utmSource: null, utmMedium: null, utmCampaign: null, utmTerm: null,
  utmContent: null, gclid: null, fbclid: null, msclkid: null,
  referrer: null, landingPath: null, landingPageId: null, campaign: null,
};

const nn = (v: string | undefined): string | null => (v && v.trim() ? v.trim() : null);

/**
 * Resolve captured attribution into Lead columns, linking the landing path to
 * a CMS Page when one matches. Never throws — a failed lookup must not cost a
 * lead, so the enquiry is always saved with whatever attribution survived.
 */
export async function resolveAttribution(
  input: AttributionInput | undefined | null,
): Promise<AttributionFields> {
  if (!input) return EMPTY;

  const fields: AttributionFields = {
    ...EMPTY,
    utmSource: nn(input.utmSource),
    utmMedium: nn(input.utmMedium),
    utmCampaign: nn(input.utmCampaign),
    utmTerm: nn(input.utmTerm),
    utmContent: nn(input.utmContent),
    gclid: nn(input.gclid),
    fbclid: nn(input.fbclid),
    msclkid: nn(input.msclkid),
    referrer: nn(input.referrer),
    landingPath: nn(input.landingPath),
    // `campaign` predates the utm columns and is what the CRM filters on, so
    // keep it in step rather than leaving two sources of truth.
    campaign: nn(input.utmCampaign),
  };

  const path = fields.landingPath;
  if (path && path !== "/") {
    const slug = path.replace(/^\/+/, "").replace(/\/+$/, "").split("?")[0];
    if (slug) {
      const page = await db.page
        .findUnique({ where: { slug }, select: { id: true } })
        .catch(() => null);
      fields.landingPageId = page?.id ?? null;
    }
  }
  return fields;
}
