/* Lead scoring — client-safe core (no db/server imports).

   A lead earns points from a fixed catalog of intent signals; the total is
   clamped to 0–100 and bucketed into Hot / Warm / Cold. Point weights, which
   signals count, and the band thresholds are all editable in the admin and
   passed in as `config` — this file only knows how to compute. The server
   wrapper (lib/scoring-server) loads the config and persists the score. */

export type ScoreLead = {
  email?: string | null;
  company?: string | null;
  website?: string | null;
  budget?: string | null;
  expectedRevenue?: number | null;
  priority?: string | null;
  source?: string | null;
  services?: string[];
  message?: string | null;
  activityCount?: number;
};

export type SignalKey =
  | "hasEmail"
  | "hasCompany"
  | "hasWebsite"
  | "hasBudget"
  | "highRevenue"
  | "priorityUrgent"
  | "priorityHigh"
  | "referral"
  | "paidIntent"
  | "warmInbound"
  | "multiService"
  | "urgentKeyword"
  | "engaged";

type Signal = {
  key: SignalKey;
  label: string;
  hint: string;
  defaultPoints: number;
  test: (l: ScoreLead) => boolean;
};

const HIGH_REVENUE = 100_000;
const PAID_SOURCES = ["PPC", "GOOGLE_ADS", "FACEBOOK", "INSTAGRAM", "LINKEDIN", "LANDING"];
const WARM_SOURCES = ["CONTACT", "AUDIT", "ESTIMATOR", "WHATSAPP", "SUTRABOT"];
const URGENT_RE = /\b(urgent|urgently|asap|immediately|right away)\b/i;

export const SCORE_SIGNALS: Signal[] = [
  { key: "hasEmail", label: "Has email", hint: "Reachable by email", defaultPoints: 8, test: (l) => !!l.email },
  { key: "hasCompany", label: "Has company", hint: "Business enquiry, not personal", defaultPoints: 8, test: (l) => !!l.company },
  { key: "hasWebsite", label: "Has a website", hint: "Established business", defaultPoints: 5, test: (l) => !!l.website },
  { key: "hasBudget", label: "Stated a budget", hint: "Gave a budget", defaultPoints: 12, test: (l) => !!l.budget },
  { key: "highRevenue", label: "High expected revenue", hint: `Expected revenue ≥ ₹${HIGH_REVENUE.toLocaleString("en-IN")}`, defaultPoints: 15, test: (l) => (l.expectedRevenue ?? 0) >= HIGH_REVENUE },
  { key: "priorityUrgent", label: "Priority: Urgent", hint: "Marked urgent", defaultPoints: 25, test: (l) => l.priority === "URGENT" },
  { key: "priorityHigh", label: "Priority: High", hint: "Marked high", defaultPoints: 15, test: (l) => l.priority === "HIGH" },
  { key: "referral", label: "Referral", hint: "Came via referral", defaultPoints: 20, test: (l) => l.source === "REFERRAL" },
  { key: "paidIntent", label: "Paid / high-intent source", hint: "Ads, landing page, social", defaultPoints: 15, test: (l) => !!l.source && PAID_SOURCES.includes(l.source) },
  { key: "warmInbound", label: "Warm inbound", hint: "Contact form, audit, chatbot, WhatsApp", defaultPoints: 10, test: (l) => !!l.source && WARM_SOURCES.includes(l.source) },
  { key: "multiService", label: "Multiple services", hint: "Interested in 2+ services", defaultPoints: 6, test: (l) => (l.services?.length ?? 0) >= 2 },
  { key: "urgentKeyword", label: "Urgency in the message", hint: "Message says urgent / ASAP", defaultPoints: 8, test: (l) => !!l.message && URGENT_RE.test(l.message) },
  { key: "engaged", label: "Engaged (3+ activities)", hint: "Multiple logged interactions", defaultPoints: 10, test: (l) => (l.activityCount ?? 0) >= 3 },
];

export const SCORE_BANDS = ["HOT", "WARM", "COLD"] as const;
export type ScoreBand = (typeof SCORE_BANDS)[number];

export const BAND_LABEL: Record<ScoreBand, string> = { HOT: "Hot", WARM: "Warm", COLD: "Cold" };
export const BAND_STYLE: Record<ScoreBand, string> = {
  HOT: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  WARM: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  COLD: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
};

export type ScoringConfig = {
  hotMin: number;
  warmMin: number;
  /** Per-signal overrides; a missing key means "enabled at its default points". */
  signals: Partial<Record<SignalKey, { enabled: boolean; points: number }>>;
};

export const DEFAULT_SCORING: ScoringConfig = { hotMin: 90, warmMin: 60, signals: {} };

/** Sanitise a stored/posted config into a safe ScoringConfig. */
export function mergeScoringConfig(raw: unknown): ScoringConfig {
  const r = (raw ?? {}) as Partial<ScoringConfig>;
  const warmMin = clampInt(r.warmMin, 0, 100, DEFAULT_SCORING.warmMin);
  const hotMin = clampInt(r.hotMin, warmMin + 1, 100, Math.max(DEFAULT_SCORING.hotMin, warmMin + 1));
  const signals: ScoringConfig["signals"] = {};
  const known = new Set(SCORE_SIGNALS.map((s) => s.key));
  for (const [k, v] of Object.entries(r.signals ?? {})) {
    if (!known.has(k as SignalKey) || !v) continue;
    signals[k as SignalKey] = {
      enabled: v.enabled !== false,
      points: clampInt(v.points, -50, 100, defaultPoints(k as SignalKey)),
    };
  }
  return { hotMin, warmMin, signals };
}

function defaultPoints(key: SignalKey): number {
  return SCORE_SIGNALS.find((s) => s.key === key)?.defaultPoints ?? 0;
}
function clampInt(v: unknown, lo: number, hi: number, fallback: number): number {
  const n = typeof v === "number" ? Math.round(v) : NaN;
  if (Number.isNaN(n)) return fallback;
  return Math.min(hi, Math.max(lo, n));
}

export function bandOf(score: number, cfg: ScoringConfig): ScoreBand {
  if (score >= cfg.hotMin) return "HOT";
  if (score >= cfg.warmMin) return "WARM";
  return "COLD";
}

export type ScoreResult = {
  score: number;
  band: ScoreBand;
  breakdown: { key: SignalKey; label: string; points: number }[];
};

export function computeScore(lead: ScoreLead, cfg: ScoringConfig = DEFAULT_SCORING): ScoreResult {
  const breakdown: ScoreResult["breakdown"] = [];
  let total = 0;
  for (const sig of SCORE_SIGNALS) {
    const override = cfg.signals[sig.key];
    if (override?.enabled === false) continue;
    if (!sig.test(lead)) continue;
    const points = override?.points ?? sig.defaultPoints;
    total += points;
    breakdown.push({ key: sig.key, label: sig.label, points });
  }
  const score = Math.min(100, Math.max(0, total));
  return { score, band: bandOf(score, cfg), breakdown };
}
