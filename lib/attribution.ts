/* First-touch campaign attribution, captured in the browser.

   Why first-touch: someone arrives on /seo-services from a Google ad, browses
   to /contact, and submits there. Reading the URL at submit time would credit
   the enquiry to a bare /contact with no campaign at all. So the entry point
   is recorded once per tab and reused for every form on that visit.

   Storage is sessionStorage — the same ephemeral, cookie-less per-tab bucket
   TrackPageview already uses for ds_sid. Nothing persists past the tab, so
   this adds no lasting visitor identifier. */

export const ATTR_KEY = "ds_attr";

export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  /** Paid-click ids: Google, Meta, Microsoft. */
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  /** Only an external referrer is worth keeping — our own pages are noise. */
  referrer?: string;
  /** Path of the first page seen this visit. */
  landingPath?: string;
};

const PARAMS: [keyof Attribution, string][] = [
  ["utmSource", "utm_source"],
  ["utmMedium", "utm_medium"],
  ["utmCampaign", "utm_campaign"],
  ["utmTerm", "utm_term"],
  ["utmContent", "utm_content"],
  ["gclid", "gclid"],
  ["fbclid", "fbclid"],
  ["msclkid", "msclkid"],
];

const trim = (v: string | null): string | undefined => {
  const s = (v ?? "").trim().slice(0, 200);
  return s || undefined;
};

/** Read the current URL and referrer into an attribution record. */
function fromLocation(): Attribution {
  const q = new URLSearchParams(window.location.search);
  const out: Attribution = {};
  for (const [key, param] of PARAMS) {
    const v = trim(q.get(param));
    if (v) out[key] = v;
  }
  const ref = document.referrer;
  if (ref) {
    try {
      // Same-origin referrers are internal navigation, not a traffic source.
      if (new URL(ref).host !== window.location.host) out.referrer = ref.slice(0, 300);
    } catch {
      /* malformed referrer — ignore it */
    }
  }
  out.landingPath = window.location.pathname.slice(0, 300);
  return out;
}

/** Record the entry point once per tab. Safe to call on every page. */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(ATTR_KEY)) return; // first touch wins
    sessionStorage.setItem(ATTR_KEY, JSON.stringify(fromLocation()));
  } catch {
    /* storage blocked (private mode, hardened profile) — attribution is
       best-effort and must never break a page or a form */
  }
}

/** What was captured, for attaching to a submission. */
export function readAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(ATTR_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : {};
  } catch {
    return {};
  }
}

/** True when there is anything worth sending. */
export function hasAttribution(a: Attribution): boolean {
  return Object.values(a).some(Boolean);
}
