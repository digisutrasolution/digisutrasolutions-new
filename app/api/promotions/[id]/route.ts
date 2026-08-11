import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import { PromotionSchema } from "@/app/api/promotions/route";
import { commercialEditBlocked, resetsReview } from "@/lib/promotions-workflow";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("promos.manage");
  if (error) return error;
  const { id } = await params;

  const parsed = PromotionSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const current = await db.promotion.findUnique({
    where: { id },
    select: { status: true, maxClaims: true, endsAt: true },
  });
  if (!current) {
    return NextResponse.json({ ok: false, error: "Offer not found." }, { status: 404 });
  }

  /* The workflow has to be enforced here, not only in the UI. Hiding a field
     stops honest mistakes; this stops the request that skips the screen. */
  const blocked = commercialEditBlocked(current.status, current, parsed.data);
  if (blocked) {
    return NextResponse.json({ ok: false, error: blocked }, { status: 409 });
  }

  /* Changing the terms of something under review invalidates the review it is
     under — the same rule that resets a page's workflow stage when its content
     changes. Approving a draft someone quietly re-priced afterwards is exactly
     the failure the gate exists to prevent. */
  const reset = resetsReview(current.status, parsed.data);

  const updated = await db.promotion
    .update({
      where: { id },
      data: {
        ...parsed.data,
        ...(reset
          ? {
              status: "DRAFT" as const,
              statusNote: "Returned to draft automatically — the terms changed during review.",
            }
          : {}),
      },
      select: { id: true, name: true, status: true },
    })
    .catch(() => null);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Offer not found." }, { status: 404 });
  }

  audit({
    userId: user.id,
    action: "promotion.update",
    entity: "promotion",
    entityId: id,
    meta: { fields: Object.keys(parsed.data), ...(reset ? { reviewReset: true } : {}) },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, promotion: updated });
}

export async function DELETE(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("promos.manage");
  if (error) return error;
  const { id } = await params;

  /* Codes already issued are a promise made to a client. Deleting the offer
     would cascade them away, so an offer with claims can only be switched
     off — the history stays. */
  const claims = await db.promotionClaim.count({ where: { promotionId: id } });
  if (claims > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: `${claims} code${claims === 1 ? " has" : "s have"} been issued — switch the offer off instead of deleting it.`,
      },
      { status: 409 },
    );
  }

  const gone = await db.promotion.delete({ where: { id } }).catch(() => null);
  if (!gone) {
    return NextResponse.json({ ok: false, error: "Offer not found." }, { status: 404 });
  }

  audit({
    userId: user.id,
    action: "promotion.delete",
    entity: "promotion",
    entityId: id,
    meta: { name: gone.name },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
