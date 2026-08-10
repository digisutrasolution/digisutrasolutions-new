import "server-only";
import { db } from "@/lib/db";
import type { Promotion } from "@prisma/client";

/* Promotion lookups shared by the offer page and the claim endpoint, so the
   two can never disagree about whether an offer is live. */

/** Is this promotion running right now? */
export function isPromotionLive(p: Promotion, now = new Date()): boolean {
  if (!p.isActive) return false;
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
    .findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" }, take: 10 })
    .catch(() => []);
  return live.find((p) => isPromotionLive(p, now)) ?? null;
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
