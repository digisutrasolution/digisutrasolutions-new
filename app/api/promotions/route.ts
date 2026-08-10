import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export const PromotionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  isActive: z.boolean().optional(),
  discountType: z.enum(["PERCENT", "AMOUNT"]).optional(),
  discountValue: z.number().min(0).max(1_000_000).optional(),
  currency: z.string().trim().min(3).max(3).optional(),
  headline: z.string().trim().max(160).optional(),
  body: z.string().trim().max(600).optional(),
  channels: z.array(z.string().trim().max(40)).max(12).optional(),
  codePrefix: z
    .string()
    .trim()
    .toUpperCase()
    .min(2)
    .max(12)
    .regex(/^[A-Z0-9]+$/, "Letters and numbers only.")
    .optional(),
  startsAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional(),
  maxClaims: z.number().int().min(1).max(100_000).nullable().optional(),
});

export async function GET() {
  const { error } = await requirePermission("promos.manage");
  if (error) return error;

  const promotions = await db.promotion.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { claims: true } } },
  });
  // Redemptions are the number that matters — a claim is intent, a redemption
  // is a discount actually given.
  const redeemed = await db.promotionClaim.groupBy({
    by: ["promotionId"],
    where: { redeemedAt: { not: null } },
    _count: { _all: true },
  });
  const redeemedBy = new Map(redeemed.map((r) => [r.promotionId, r._count._all]));

  return NextResponse.json({
    ok: true,
    promotions: promotions.map((p) => ({
      ...p,
      claims: p._count.claims,
      redeemed: redeemedBy.get(p.id) ?? 0,
    })),
  });
}

export async function POST(req: Request) {
  const { user, error } = await requirePermission("promos.manage");
  if (error) return error;

  const parsed = PromotionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const promotion = await db.promotion.create({
    data: { ...parsed.data },
    select: { id: true, name: true },
  });

  audit({
    userId: user.id,
    action: "promotion.create",
    entity: "promotion",
    entityId: promotion.id,
    meta: { name: promotion.name },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, promotion }, { status: 201 });
}
