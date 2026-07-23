import { z } from "zod";
import { db } from "@/lib/db";

/* Proactive DigiSutra Bot greeting ("nudge"). A small bubble appears beside
   the launcher after a delay or a scroll depth, carrying a message matched
   to the page. Everything here is admin-editable in /admin/settings, so
   copy and timing can change without a deploy. */

export const NudgeRuleSchema = z.object({
  /** Path prefix; "/" is the fallback for every page. */
  path: z.string().trim().min(1).max(120),
  text: z.string().trim().min(4).max(160),
});

/** Where the visitor came from. Either one of the keys classifySource()
    produces, or a raw utm_source so campaigns can be targeted by name. */
export const SourceRuleSchema = z.object({
  source: z.string().trim().min(1).max(60),
  text: z.string().trim().min(4).max(160),
});

/** The source keys classifySource() can return without a utm_source. */
export const KNOWN_SOURCES = [
  "google-ads",
  "meta-ads",
  "email",
  "organic-search",
  "social",
  "referral",
  "direct",
] as const;

/** Ships enabled with copy for the channels worth paying for. */
export const DEFAULT_SOURCE_RULES = [
  { source: "google-ads", text: "Saw our ad? Get your free 15-page audit — no obligation, 48 hours." },
  { source: "meta-ads", text: "Came from our ad? Tell me your goal and I'll tell you what it costs." },
  { source: "email", text: "Thanks for opening our email — want the full 15-page audit?" },
  { source: "organic-search", text: "Looking for SEO help? I can set up your free audit in 30 seconds." },
  { source: "social", text: "Found us on social? Here's the free 15-page audit, no strings." },
];

export const BotNudgeSchema = z.object({
  enabled: z.boolean(),
  delaySeconds: z.number().int().min(5).max(180),
  scrollPercent: z.number().int().min(0).max(100),
  /** Also fire when the pointer leaves toward the browser chrome — the
      last moment a leaving desktop visitor can be offered something.
      Deliberately desktop-only: there is no equivalent signal on touch,
      and the usual mobile substitutes (scroll-up, back-button traps) are
      hostile. */
  exitIntent: z.boolean().default(true),
  /** First-visit welcome. A visitor with no history has the highest bounce
      risk and no context, so they get their own copy on a shorter timer
      instead of the page-matched nudge. Defaults keep settings saved
      before this existed valid. */
  welcomeEnabled: z.boolean().default(true),
  welcomeDelaySeconds: z.number().int().min(3).max(120).default(8),
  welcomeText: z
    .string()
    .trim()
    .min(4)
    .max(160)
    .default("👋 First time here? Grab your free 15-page audit — takes 30 seconds."),
  /** Traffic-source greeting. Paid clicks cost money and carry the
      strongest intent signal, so a matching source outranks both the
      welcome and the page message. */
  sourceEnabled: z.boolean().default(true),
  sourceRules: z.array(SourceRuleSchema).max(10).default(DEFAULT_SOURCE_RULES),
  /** Match the page message against the page the visitor arrived on rather
      than the one they happen to be reading. The entry page is the intent
      they came with; later pages are just browsing. */
  entryPageEnabled: z.boolean().default(true),
  /** Hesitation: no scroll, pointer or key activity for this long suggests
      the visitor is stuck rather than reading, so offer help. */
  idleEnabled: z.boolean().default(true),
  idleSeconds: z.number().int().min(5).max(180).default(25),
  /** A visitor on their second page of the session has shown intent, so
      they get the greeting on the short timer rather than the long one. */
  secondPageviewEnabled: z.boolean().default(true),
  rules: z.array(NudgeRuleSchema).max(12),
});

export type NudgeRule = z.infer<typeof NudgeRuleSchema>;
export type BotNudge = z.infer<typeof BotNudgeSchema>;

/** Pages where a nudge would interrupt someone already converting. */
export const NUDGE_EXCLUDED_PATHS = ["/contact"];

/** Dismissals are remembered for a week. */
export const NUDGE_COOLDOWN_DAYS = 7;

/** Stamped the first time a browser loads the site; its absence is what
    identifies a brand-new visitor. */
export const FIRST_TOUCH_KEY = "ds-first-touch";

export const DEFAULT_BOT_NUDGE: BotNudge = {
  enabled: true,
  delaySeconds: 15,
  scrollPercent: 40,
  exitIntent: true,
  welcomeEnabled: true,
  welcomeDelaySeconds: 8,
  welcomeText: "👋 First time here? Grab your free 15-page audit — takes 30 seconds.",
  sourceEnabled: true,
  sourceRules: DEFAULT_SOURCE_RULES,
  entryPageEnabled: true,
  idleEnabled: true,
  idleSeconds: 25,
  secondPageviewEnabled: true,
  rules: [
    { path: "/pricing", text: "Not sure which plan fits? Tell me your budget and I'll pick one." },
    { path: "/services", text: "Want to know what this would cost for your business?" },
    { path: "/work", text: "Want results like these? I can set up your free audit." },
    { path: "/blog", text: "Want this done for you? Free 15-page audit, in 48 hours." },
    { path: "/payment", text: "Questions about payment, invoices or GST? Ask me." },
    { path: "/free-tools", text: "Want a human to read these numbers with you?" },
    { path: "/", text: "Want the free 15-page audit? I can set it up in 30 seconds." },
  ],
};

export async function getBotNudge(): Promise<BotNudge> {
  try {
    const row = await db.siteSetting.findUnique({ where: { key: "botNudge" } });
    const parsed = BotNudgeSchema.safeParse(row?.value);
    if (parsed.success) return parsed.data;
  } catch {
    /* DB down → defaults keep the bot behaving predictably */
  }
  return DEFAULT_BOT_NUDGE;
}

/** Session key holding the classified source — a utm only exists on the
    landing URL, so it has to be captured before the visitor navigates. */
export const SOURCE_KEY = "ds-traffic-source";

/** Session key holding the path the visitor arrived on. Stored basePath-free
    (it comes from usePathname) so it matches the rule paths directly. */
export const ENTRY_PATH_KEY = "ds-entry-path";

/** Session key counting pages viewed this visit (drives the 2nd-page rule). */
export const PAGEVIEWS_KEY = "ds-session-pageviews";

const SEARCH_HOSTS = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|brave|baidu|yandex)\./;
const SOCIAL_HOSTS =
  /(^|\.)(facebook|instagram|linkedin|twitter|x|t|youtube|pinterest|reddit|whatsapp|threads)\.(com|co|me|be)/;

/**
 * Works out where a visit came from, from the landing query string and the
 * referrer. Paid-click ids (gclid/fbclid) are the most reliable signal and
 * are checked first; an unrecognised utm_source is returned verbatim so a
 * campaign can be targeted by its own name.
 *
 * Pure so it can be unit-checked — the caller passes its own hostname
 * rather than this reaching for `window`.
 */
export function classifySource(search: string, referrer: string, selfHost: string): string {
  const q = new URLSearchParams(search);
  const utmSource = (q.get("utm_source") ?? "").toLowerCase().trim();
  const utmMedium = (q.get("utm_medium") ?? "").toLowerCase().trim();
  const paid = /^(cpc|ppc|paid|paidsearch|paid_social|paid-social)$/.test(utmMedium);

  if (q.has("gclid") || (utmSource.includes("google") && paid)) return "google-ads";
  if (
    q.has("fbclid") ||
    ((utmSource.includes("facebook") || utmSource.includes("instagram") || utmSource.includes("meta")) &&
      paid)
  ) {
    return "meta-ads";
  }
  if (utmMedium === "email" || utmSource === "email" || utmSource === "newsletter") return "email";
  if (utmSource) return utmSource;

  let host = "";
  try {
    host = referrer ? new URL(referrer).hostname.toLowerCase() : "";
  } catch {
    host = "";
  }
  // No referrer, or arriving from our own pages, is a direct visit.
  if (!host || host === selfHost.toLowerCase()) return "direct";
  if (SEARCH_HOSTS.test(host)) return "organic-search";
  if (SOCIAL_HOSTS.test(host)) return "social";
  return "referral";
}

/** Exact, case-insensitive source match; null when nothing is configured. */
export function sourceTextFor(nudge: BotNudge, source: string): string | null {
  if (!nudge.sourceEnabled || !source) return null;
  const s = source.toLowerCase();
  return nudge.sourceRules.find((r) => r.source.trim().toLowerCase() === s)?.text ?? null;
}

/** Longest matching path prefix wins; returns null when nothing matches. */
export function nudgeTextFor(nudge: BotNudge, pathname: string): string | null {
  const matches = nudge.rules
    .filter((r) => pathname === r.path || pathname.startsWith(r.path === "/" ? "/" : `${r.path}`))
    .sort((a, b) => b.path.length - a.path.length);
  return matches[0]?.text ?? null;
}
