import { createHash } from "node:crypto";

/* A/B split assignment.

   STICKINESS WITHOUT A COOKIE. This site is deliberately cookie-less — the
   analytics are first-party and the only visitor key that exists is an
   ephemeral per-tab sessionStorage id, which the server cannot read while it
   renders. Setting an assignment cookie would be the textbook answer and would
   also be the first tracking cookie on the site, which is a product decision,
   not one to make in passing.

   So assignment is DERIVED, not stored: a hash of the visitor's coarse
   fingerprint, the control page, and the day. The same visitor gets the same
   variant all day on the same page, and nothing is written anywhere.

   The trade-off, stated plainly: a visitor can be reassigned across a day
   boundary or if their IP changes (mobile handover). That blurs a test
   slightly at the edges; it does not bias it, because reassignment is
   symmetric between arms. For marketing copy tests that is a fair price for
   staying cookie-less. If a test ever needs strict per-person stickiness, that
   is the moment to discuss a cookie.

   Day bucketing also means a visitor's assignment is not stable enough to act
   as an identifier, which is the privacy property worth keeping. */

export type VariantArm = {
  id: string;
  /** Relative share against the other arms. Non-positive means "never serve". */
  variantWeight: number;
};

/** UTC day, so every server in a deployment agrees on the bucket. */
function dayBucket(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Pick one arm deterministically. `arms` must include the control first.
 * Returns the control when there is nothing to split or every weight is zero.
 */
export function pickArm<T extends VariantArm>(
  arms: T[],
  fingerprint: string,
  controlId: string,
  now: Date = new Date(),
): T {
  const live = arms.filter((a) => a.variantWeight > 0);
  if (live.length <= 1) return arms[0];

  const total = live.reduce((sum, a) => sum + a.variantWeight, 0);
  if (total <= 0) return arms[0];

  /* 32 bits of the digest as a fraction of the range. Hashing the control id
     in as well means a visitor is not put in "the B arm" of every test at
     once, which would correlate the results of unrelated tests. */
  const digest = createHash("sha256")
    .update(`${fingerprint}|${controlId}|${dayBucket(now)}`)
    .digest();
  const point = (digest.readUInt32BE(0) / 0x1_0000_0000) * total;

  let cursor = 0;
  for (const arm of live) {
    cursor += arm.variantWeight;
    if (point < cursor) return arm;
  }
  return live[live.length - 1];
}

/**
 * A coarse, non-stored visitor key. Deliberately weak: enough to keep one
 * person on one arm for a day, not enough to follow them. Never persisted.
 */
export function fingerprint(ip: string, userAgent: string): string {
  return createHash("sha256").update(`${ip}|${userAgent}`).digest("hex").slice(0, 32);
}
