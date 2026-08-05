/* Anti-spam scoring (Phase 1).
 *
 * Client-safe on purpose: the public forms import it to mint the proof-of-JS
 * token, and the admin UI uses the labels. The server-only half — IP velocity
 * and the quarantine decision — lives in lib/spam-server.ts.
 *
 * Philosophy, unchanged from the honeypot/time-trap that came before it:
 * CAPTURE FIRST, NEVER BLOCK. Every submission is still stored. A high score
 * only routes the lead to the SPAM bucket and silences the notifications, so a
 * false positive costs one click to recover instead of losing a real enquiry.
 * That is why no single soft signal can quarantine on its own.
 */

/** Hidden field name carrying the proof-of-JS token. */
export const SPAM_TOKEN_FIELD = "jsToken";

/** Mint the token. A bot POSTing raw JSON never runs this. */
export function makeSpamToken(now: number = Date.now()): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${now.toString(36)}.${rand}`;
}

export type TokenVerdict = "valid" | "missing" | "malformed" | "stale";

/** Validate shape + age. Stateless — no store, no round-trip. */
export function checkSpamToken(
  token: string | null | undefined,
  now: number = Date.now(),
): TokenVerdict {
  if (!token) return "missing";
  const m = /^([0-9a-z]{5,12})\.([0-9a-z]{4,12})$/.exec(token);
  if (!m) return "malformed";
  const issued = Number.parseInt(m[1], 36);
  if (!Number.isFinite(issued)) return "malformed";
  const age = now - issued;
  // Clock skew tolerance one way, a working day the other: anything older is a
  // recycled token from a scraped page.
  if (age < -60_000 || age > 12 * 60 * 60 * 1000) return "stale";
  return "valid";
}

/* Throwaway inbox providers. Deliberately short — these are the ones that show
   up on Indian SMB lead forms; a long list buys little and ages badly. */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
  "temp-mail.org", "throwawaymail.com", "yopmail.com", "sharklasers.com",
  "getnada.com", "trashmail.com", "fakeinbox.com", "maildrop.cc",
  "dispostable.com", "mailnesia.com", "spamgourmet.com", "mintemail.com",
  "tempinbox.com", "emailondeck.com", "moakt.com", "tempmailo.com",
]);

const URL_RE = /https?:\/\/|www\.[a-z0-9-]+\.[a-z]{2,}/gi;
const BBCODE_RE = /\[url[=\]]|\[\/url\]|<a\s+href=/i;

function countUrls(text: string): number {
  URL_RE.lastIndex = 0;
  return (text.match(URL_RE) ?? []).length;
}

/** Conservative on purpose — transliterated and non-English names must pass.
    Only a long token with no vowel at all counts. */
function looksGibberish(name: string): boolean {
  const n = name.trim();
  if (n.length < 8 || n.includes(" ")) return false;
  return !/[aeiouAEIOU]/.test(n);
}

export type SpamInput = {
  name?: string | null;
  email?: string | null;
  message?: string | null;
  company?: string | null;
  /** Honeypot field(s) came back filled. */
  honeypot?: boolean;
  /** Milliseconds between page ready and submit; null when not measured. */
  elapsedMs?: number | null;
  /** Proof-of-JS token from the form. */
  token?: string | null;
  /** Submissions already seen from this IP inside the velocity window. */
  recentFromIp?: number;
};

export type SpamSignalId =
  | "honeypot"
  | "noJs"
  | "badToken"
  | "tooFast"
  | "disposableEmail"
  | "linkStuffing"
  | "markup"
  | "urlInName"
  | "gibberishName"
  | "velocity";

type Signal = {
  id: SpamSignalId;
  label: string;
  points: number;
  test: (i: SpamInput) => boolean;
};

/* Points are tuned so that one hard signal (honeypot) quarantines on its own,
   while soft signals need to agree with each other. */
export const SPAM_SIGNALS: readonly Signal[] = [
  {
    id: "honeypot",
    label: "hidden honeypot field was filled",
    points: 60,
    test: (i) => Boolean(i.honeypot),
  },
  {
    id: "noJs",
    label: "submitted without running the page script",
    points: 35,
    test: (i) => checkSpamToken(i.token) === "missing",
  },
  {
    id: "badToken",
    label: "form token was malformed or expired",
    points: 20,
    test: (i) => {
      const v = checkSpamToken(i.token);
      return v === "malformed" || v === "stale";
    },
  },
  {
    id: "tooFast",
    label: "submitted seconds after the page loaded",
    points: 20,
    test: (i) => typeof i.elapsedMs === "number" && i.elapsedMs >= 0 && i.elapsedMs < 3000,
  },
  {
    id: "disposableEmail",
    label: "throwaway email domain",
    points: 25,
    test: (i) => {
      const at = (i.email ?? "").toLowerCase().split("@")[1];
      return Boolean(at && DISPOSABLE_DOMAINS.has(at.trim()));
    },
  },
  {
    id: "linkStuffing",
    label: "message is stuffed with links",
    points: 30,
    test: (i) => countUrls(i.message ?? "") >= 3,
  },
  {
    id: "markup",
    label: "message contains BBCode or HTML links",
    points: 35,
    test: (i) => BBCODE_RE.test(i.message ?? ""),
  },
  {
    id: "urlInName",
    label: "name field contains a link",
    points: 30,
    test: (i) => countUrls(i.name ?? "") > 0,
  },
  {
    id: "gibberishName",
    label: "name looks machine-generated",
    points: 20,
    test: (i) => looksGibberish(i.name ?? ""),
  },
  {
    /* Deliberately weak and late-firing. Carrier-grade NAT and office gateways
       put many genuine visitors behind one address — common in India, the main
       market — so a shared IP must never quarantine on its own or in a pair.
       It corroborates, it does not convict. */
    id: "velocity",
    label: "several submissions from the same address in minutes",
    points: 15,
    test: (i) => (i.recentFromIp ?? 0) >= 5,
  },
];

/** At or above this a lead is quarantined into the SPAM bucket. */
export const SPAM_THRESHOLD = 60;
/** At or above this it stays in the pipeline but is flagged for a human. */
export const REVIEW_THRESHOLD = 30;

export type SpamVerdict = "clean" | "review" | "spam";

export type SpamAssessment = {
  score: number;
  flags: { id: SpamSignalId; label: string; points: number }[];
  verdict: SpamVerdict;
};

export function scoreSpam(input: SpamInput): SpamAssessment {
  const flags = SPAM_SIGNALS.filter((s) => s.test(input)).map((s) => ({
    id: s.id,
    label: s.label,
    points: s.points,
  }));
  const score = Math.min(100, flags.reduce((sum, f) => sum + f.points, 0));
  const verdict: SpamVerdict =
    score >= SPAM_THRESHOLD ? "spam" : score >= REVIEW_THRESHOLD ? "review" : "clean";
  return { score, flags, verdict };
}

/** One-line summary for Lead.notes so the desk can see why it was flagged. */
export function spamNote(a: SpamAssessment): string | null {
  if (!a.flags.length) return null;
  const reasons = a.flags.map((f) => f.label).join("; ");
  const lead = a.verdict === "spam" ? "Quarantined as spam" : "Possible spam";
  return `${lead} (score ${a.score}): ${reasons}.`;
}
