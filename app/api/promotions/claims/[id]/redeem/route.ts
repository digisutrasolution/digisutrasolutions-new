import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

/* Mark a discount code as actually used.
 *
 * PromotionClaim.redeemedAt has existed since the promotions feature shipped
 * and was read in two places — the admin promotions page and the promotions
 * API both count `where: { redeemedAt: { not: null } }`. Nothing wrote it.
 * So the redeemed figure was structurally pinned at zero and the only number
 * that says whether an offer earned its discount could not exist.
 *
 * This is that missing write. Reversible on purpose: marking the wrong code is
 * an easy slip, and a one-way action people are afraid of is one they avoid,
 * which puts the data right back where it started. */

type Params = { params: Promise<{ id: string }> };

const Body = z.object({
  redeemed: z.boolean(),
  note: z.string().trim().max(300).optional(),
});

export async function POST(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("promos.manage");
  if (error) return error;
  const { id } = await params;

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const { redeemed, note } = parsed.data;

  const claim = await db.promotionClaim.findUnique({
    where: { id },
    select: { id: true, code: true, redeemedAt: true, promotionId: true, leadId: true },
  });
  if (!claim) {
    return NextResponse.json({ ok: false, error: "Code not found." }, { status: 404 });
  }

  /* Already in the requested state? Report success rather than an error. Two
     people clicking the same button, or a double-submit, should agree on the
     outcome instead of one of them seeing a failure. */
  if (redeemed === Boolean(claim.redeemedAt)) {
    return NextResponse.json({ ok: true, redeemedAt: claim.redeemedAt, unchanged: true });
  }

  const updated = await db.promotionClaim.update({
    where: { id },
    data: {
      redeemedAt: redeemed ? new Date() : null,
      redeemedById: redeemed ? user.id : null,
      ...(note ? { note } : {}),
    },
    select: { id: true, redeemedAt: true },
  });

  audit({
    userId: user.id,
    action: redeemed ? "promotion.redeem" : "promotion.unredeem",
    entity: "promotionClaim",
    entityId: id,
    meta: { code: claim.code, promotionId: claim.promotionId, leadId: claim.leadId },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, redeemedAt: updated.redeemedAt });
}
