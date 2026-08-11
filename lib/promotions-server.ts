import "server-only";
import { db } from "@/lib/db";
import type { Promotion } from "@prisma/client";

/* Promotion lookups shared by the offer page and the claim endpoint, so the
   two can never disagree about whether an offer is live. */

/**
 * Is this promotion issuing codes right now?
 *
 * Status AND dates, both. The dates are still checked at read time rather
 * than by a cron, so a SCHEDULED offer opens on its own minute and a LIVE one
 * closes on its own — nobody has to be awake for either.
 *
 * PAUSED returns false here, which is exactly the point: it stops new claims
 * while leaving every code already issued valid. The old isActive boolean
 * could not say that, so pausing an offer silently broke a promise to
 * everyone holding a code.
 */
export function isPromotionLive(p: Promotion, now = new Date()): boolean {
  if (p.status !== "LIVE" && p.status !== "SCHEDULED") return false;
  if (p.startsAt && p.startsAt > now) return false;
  if (p.endsAt && p.endsAt <= now) return false;
  return true;
}

/**
 * The promotion an offer link should show: the one it was created for, or the
 * newest live one when the link does not name a specific offer. Returns null
 * when nothing is running, so the page can say "ended" rather than invent one.
 */
export async function activePromotion(
  promotionId?: string | null,
): Promise<Promotion | null> {
  const now = new Date();
  if (promotionId) {
    const named = await db.promotion.findUnique({ where: { id: promotionId } }).catch(() => null);
    return named && isPromotionLive(named, now) ? named : null;
  }
  const live = await db.promotion
    .findMany({ where: { status: { in: ["LIVE", "SCHEDULED"] } }, orderBy: { createdAt: "desc" }, take: 10 })
    .catch(() => []);
  return live.find((p) => isPromotionLive(p, now)) ?? null;
}

export type LiveOffer = Promotion & {
  /** How many codes have gone out. */
  claimed: number;
  /** null when maxClaims is null — unlimited, so there is nothing to run out. */
  remaining: number | null;
};

/**
 * Every promotion running right now, for the public /offers page.
 *
 * An offer whose codes have all gone is dropped rather than shown greyed out:
 * the page exists to be claimed from, and a wall of dead cards makes the live
 * ones harder to find. isPromotionLive still owns the date/active logic so
 * this can never disagree with the single-offer page.
 */
export async function livePromotions(): Promise<LiveOffer[]> {
  const now = new Date();
  const rows = await db.promotion
    .findMany({
      where: { status: { in: ["LIVE", "SCHEDULED"] } },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { claims: true } } },
    })
    .catch(() => []);

  return rows
    .filter((p) => isPromotionLive(p, now))
    .map(({ _count, ...p }) => ({
      ...p,
      claimed: _count.claims,
      remaining: p.maxClaims === null ? null : Math.max(0, p.maxClaims - _count.claims),
    }))
    .filter((p) => p.remaining === null || p.remaining > 0);
}

/** Human-readable discount, e.g. "10% off" or "₹5,000 off". */
export function discountLabel(p: Pick<Promotion, "discountType" | "discountValue" | "currency">): string {
  if (p.discountType === "AMOUNT") {
    const symbol = p.currency === "INR" ? "₹" : p.currency === "USD" ? "$" : `${p.currency} `;
    return `${symbol}${p.discountValue.toLocaleString("en-IN")} off`;
  }
  // Trim a pointless ".0" — "10% off" reads better than "10.0% off".
  return `${Number.isInteger(p.discountValue) ? p.discountValue : p.discountValue.toFixed(1)}% off`;
}

/**
 * The same discount split for display at poster size, e.g. {"15", "% off"}.
 *
 * Separate from discountLabel because the offer card sets the number huge and
 * the unit small beside it; reformatting the joined string with a regex to get
 * there would be a second, fragile way of saying the same thing.
 */
export function discountParts(
  p: Pick<Promotion, "discountType" | "discountValue" | "currency">,
): { value: string; unit: string } {
  const n = Number.isInteger(p.discountValue)
    ? String(p.discountValue)
    : p.discountValue.toFixed(1);
  if (p.discountType === "AMOUNT") {
    const symbol = p.currency === "INR" ? "₹" : p.currency === "USD" ? "$" : "";
    return {
      value: `${symbol}${Number(n).toLocaleString("en-IN")}`,
      unit: symbol ? "off" : `${p.currency} off`,
    };
  }
  return { value: n, unit: "% off" };
}
