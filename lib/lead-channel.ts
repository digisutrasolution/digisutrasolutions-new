import type { LeadSource } from "@prisma/client";

/* One label for "where did this lead come from".

   A lead carries eleven raw attribution columns. None of them is the answer
   on its own — utm_source alone cannot tell paid from organic, and a referrer
   alone cannot tell an ad click from someone following a blog link. This
   collapses them into one Channel plus the Platform underneath it.

   Derived on read, not stored. That means the rule can be corrected later
   without a migration, and every correction applies retroactively to leads
   already in the table. The one thing that IS written at intake is the
   LeadSource enum (see sourceFromChannel) — because lead scoring keys off it
   and scoring has to happen at the moment the row is created. */

export type Channel =
  | "Google Ads"
  | "Meta Ads"
  | "Microsoft Ads"
  | "LinkedIn"
  | "Paid other"
  | "Organic search"
  | "Organic social"
  | "Email"
  | "Referral"
  | "Direct";

/** The attribution columns this module reads. A subset of Lead. */
export type ChannelInput = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  msclkid?: string | null;
  referrer?: string | null;
};

export type Derived = {
  channel: Channel;
  /** The specific network or site, when we can name one. */
  platform: string | null;
  campaign: string | null;
  /** Which signal decided it — shown in the UI so a surprising row is
      explainable rather than magic. */
  basis: "click id" | "utm" | "referrer" | "none";
  paid: boolean;
};

const PAID_MEDIA = /^(cpc|ppc|paid|paidsocial|paid_social|paid-social|display|cpm|retargeting|remarketing)$/i;
const EMAIL_MEDIA = /^(email|e-mail|newsletter|mail)$/i;
const SOCIAL_MEDIA = /^(social|social-organic|organic_social|social_organic)$/i;
const ORGANIC_MEDIA = /^(organic|seo)$/i;

/* Known hosts, longest-suffix wins. Deliberately short: a list that tries to
   name every site turns a referrer we cannot classify into a wrong answer
   instead of an honest "Referral". */
const SEARCH_HOSTS = /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|yahoo\.[a-z.]+|ecosia\.org|brave\.com|search\.marginalia\.nu)$/i;
const SOCIAL_HOSTS = /(^|\.)(facebook\.com|instagram\.com|linkedin\.com|lnkd\.in|t\.co|x\.com|twitter\.com|youtube\.com|pinterest\.[a-z.]+|reddit\.com|quora\.com|threads\.net)$/i;
const AI_HOSTS = /(^|\.)(chatgpt\.com|chat\.openai\.com|openai\.com|perplexity\.ai|gemini\.google\.com|claude\.ai|copilot\.microsoft\.com)$/i;

function host(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

/** Title-case a raw utm_source so "google_ads" reads as "Google ads". */
function pretty(v: string): string {
  const s = v.trim().replace(/[_-]+/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Collapse a lead's attribution into one channel.
 *
 * Priority is deliberate and runs strongest signal first:
 *
 *   1. a paid click id — Google, Meta and Microsoft stamp these themselves,
 *      so they cannot be mistyped by whoever built the ad and cannot be lost
 *      by a visitor sharing the link;
 *   2. the utm_source + utm_medium pair — accurate when tagged, absent when
 *      someone forgot;
 *   3. the referring host — a guess, but a reasonable one;
 *   4. nothing — "Direct", stated plainly rather than dressed up.
 */
export function deriveChannel(l: ChannelInput): Derived {
  const campaign = l.utmCampaign?.trim() || null;

  // ---- 1. paid click ids -------------------------------------------------
  if (l.gclid?.trim())
    return { channel: "Google Ads", platform: "Google", campaign, basis: "click id", paid: true };
  if (l.fbclid?.trim())
    return { channel: "Meta Ads", platform: "Meta", campaign, basis: "click id", paid: true };
  if (l.msclkid?.trim())
    return { channel: "Microsoft Ads", platform: "Microsoft", campaign, basis: "click id", paid: true };

  // ---- 2. utm pair -------------------------------------------------------
  const src = l.utmSource?.trim() || "";
  const med = l.utmMedium?.trim() || "";
  if (src || med) {
    const s = src.toLowerCase();
    const platform = src ? pretty(src) : null;

    if (PAID_MEDIA.test(med)) {
      if (/google/.test(s)) return { channel: "Google Ads", platform: "Google", campaign, basis: "utm", paid: true };
      if (/facebook|meta|instagram|fb$/.test(s)) return { channel: "Meta Ads", platform: "Meta", campaign, basis: "utm", paid: true };
      if (/bing|microsoft|msn/.test(s)) return { channel: "Microsoft Ads", platform: "Microsoft", campaign, basis: "utm", paid: true };
      if (/linkedin/.test(s)) return { channel: "LinkedIn", platform: "LinkedIn", campaign, basis: "utm", paid: true };
      return { channel: "Paid other", platform, campaign, basis: "utm", paid: true };
    }
    if (EMAIL_MEDIA.test(med)) return { channel: "Email", platform, campaign, basis: "utm", paid: false };
    if (SOCIAL_MEDIA.test(med)) return { channel: "Organic social", platform, campaign, basis: "utm", paid: false };
    if (ORGANIC_MEDIA.test(med)) return { channel: "Organic search", platform, campaign, basis: "utm", paid: false };
    if (/referral/i.test(med)) return { channel: "Referral", platform, campaign, basis: "utm", paid: false };

    /* Tagged, but with a medium we do not recognise. Fall back on the source
       name — someone who tagged utm_source=linkedin meant LinkedIn even if
       utm_medium says something we have never seen. */
    if (/linkedin/.test(s)) return { channel: "LinkedIn", platform: "LinkedIn", campaign, basis: "utm", paid: false };
    if (/facebook|meta|instagram/.test(s)) return { channel: "Organic social", platform: pretty(src), campaign, basis: "utm", paid: false };
    if (/google|bing/.test(s)) return { channel: "Organic search", platform: pretty(src), campaign, basis: "utm", paid: false };
    return { channel: "Referral", platform, campaign, basis: "utm", paid: false };
  }

  // ---- 3. referrer -------------------------------------------------------
  const h = host(l.referrer);
  if (h) {
    if (SEARCH_HOSTS.test(h)) return { channel: "Organic search", platform: h, campaign, basis: "referrer", paid: false };
    /* AI assistants are counted as organic search on purpose: for this agency
       an answer-engine citation is the same job as a blue link, and splitting
       them would scatter one channel across two rows. The platform column
       still names the engine. */
    if (AI_HOSTS.test(h)) return { channel: "Organic search", platform: h, campaign, basis: "referrer", paid: false };
    if (SOCIAL_HOSTS.test(h)) {
      const linkedin = /linkedin\.com|lnkd\.in/.test(h);
      return { channel: linkedin ? "LinkedIn" : "Organic social", platform: h, campaign, basis: "referrer", paid: false };
    }
    return { channel: "Referral", platform: h, campaign, basis: "referrer", paid: false };
  }

  // ---- 4. nothing --------------------------------------------------------
  return { channel: "Direct", platform: null, campaign, basis: "none", paid: false };
}

/** Every channel, in the order reports should list them. */
export const CHANNELS: Channel[] = [
  "Google Ads",
  "Meta Ads",
  "Microsoft Ads",
  "LinkedIn",
  "Paid other",
  "Organic search",
  "Organic social",
  "Email",
  "Referral",
  "Direct",
];

/* Chip colours. Paid channels are warm, earned channels cool, Direct neutral
   — so a glance down the column separates bought traffic from earned traffic
   before you read a single word. */
export const CHANNEL_CLASS: Record<Channel, string> = {
  "Google Ads":     "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  "Meta Ads":       "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  "Microsoft Ads":  "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  LinkedIn:         "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  "Paid other":     "bg-yellow-100 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200",
  "Organic search": "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  "Organic social": "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200",
  Email:            "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  Referral:         "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  Direct:           "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
};

/**
 * The LeadSource enum value a channel implies.
 *
 * This is the half that must be written at intake rather than derived on
 * read: lib/scoring.ts awards 15 points for `paidIntent` when source is one
 * of the paid values, and the score is computed as the row is created. Before
 * this existed nothing ever wrote GOOGLE_ADS/PPC/FACEBOOK/LINKEDIN, so that
 * signal could never fire and every ad-driven lead scored 15 points light.
 *
 * Returns null when attribution says nothing — the caller then keeps whatever
 * the intake route intended (CONTACT, AUDIT, FORM…), which is still the most
 * truthful thing we know about that lead.
 *
 * Only the paid channels map, on purpose. The enum also has REFERRAL, ORGANIC
 * and EMAIL_CAMPAIGN, and mapping to them would make things worse, not better:
 *
 * - REFERRAL scores 20 points because in a CRM it means a person referred
 *   them. Our "Referral" channel only means the click came from some other
 *   website, which is a completely different and much weaker signal. Mapping
 *   it would hand a stray backlink the same weight as a warm introduction.
 * - ORGANIC and EMAIL_CAMPAIGN are in neither PAID_SOURCES nor WARM_SOURCES,
 *   so writing them would silently drop the 10-point warm-inbound credit these
 *   leads get today as CONTACT/AUDIT. A reporting change should not quietly
 *   re-score leads downward.
 *
 * Channel reporting reads the raw columns anyway, so those leads lose nothing
 * by keeping their intake value here.
 */
export function sourceFromChannel(d: Derived): LeadSource | null {
  switch (d.channel) {
    case "Google Ads":
      return "GOOGLE_ADS";
    case "Meta Ads":
      return "FACEBOOK";
    case "Microsoft Ads":
    case "Paid other":
      return "PPC";
    case "LinkedIn":
      return "LINKEDIN";
    default:
      return null;
  }
}
