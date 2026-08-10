import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import { PromotionSchema } from "@/app/api/promotions/route";

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

  const updated = await db.promotion
    .update({ where: { id }, data: parsed.data, select: { id: true, name: true } })
    .catch(() => null);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Offer not found." }, { status: 404 });
  }

  audit({
    userId: user.id,
    action: "promotion.update",
    entity: "promotion",
    entityId: id,
    meta: { fields: Object.keys(parsed.data) },
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
