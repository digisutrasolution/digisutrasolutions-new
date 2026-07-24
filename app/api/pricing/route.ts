import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import {
  MatrixRowSchema,
  PlanSchema,
  RateRowSchema,
  bootstrapPricingIfEmpty,
} from "@/lib/catalog-admin";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

export async function GET() {
  const { error } = await requirePermission("pricing.manage");
  if (error) return error;
  await bootstrapPricingIfEmpty();
  const [plans, matrix, rateCard] = await Promise.all([
    db.pricingPlan.findMany({ orderBy: { order: "asc" } }),
    db.pricingRow.findMany({ orderBy: { order: "asc" } }),
    db.rateCardRow.findMany({ orderBy: { order: "asc" } }),
  ]);
  return NextResponse.json({ ok: true, plans, matrix, rateCard });
}

const CreateSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("plan"), data: PlanSchema }),
  z.object({ kind: z.literal("matrix"), data: MatrixRowSchema }),
  z.object({ kind: z.literal("rate"), data: RateRowSchema }),
]);

export async function POST(req: Request) {
  const { user, error } = await requirePermission("pricing.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const { kind, data } = parsed.data;

  let created: { id: string };
  if (kind === "plan") {
    const last = await db.pricingPlan.findFirst({ orderBy: { order: "desc" } });
    created = await db.pricingPlan.create({
      data: {
        name: data.name,
        price: data.price,
        quarterlyPrice: data.quarterlyPrice ?? null,
        priceUsd: data.priceUsd ?? null,
        quarterlyPriceUsd: data.quarterlyPriceUsd ?? null,
        period: data.period ?? "/mo",
        tagline: data.tagline ?? "",
        marketNote: data.marketNote ?? null,
        cta: data.cta ?? "Choose plan",
        featured: data.featured ?? false,
        visible: data.visible ?? true,
        order: (last?.order ?? -1) + 1,
      },
    });
  } else if (kind === "matrix") {
    const last = await db.pricingRow.findFirst({ orderBy: { order: "desc" } });
    created = await db.pricingRow.create({
      data: {
        label: data.label,
        tooltip: data.tooltip ?? null,
        values: data.values,
        visible: data.visible ?? true,
        order: (last?.order ?? -1) + 1,
      },
    });
  } else {
    const last = await db.rateCardRow.findFirst({ orderBy: { order: "desc" } });
    created = await db.rateCardRow.create({
      data: {
        label: data.label,
        price: data.price,
        priceUsd: data.priceUsd ?? null,
        marketNote: data.marketNote ?? null,
        visible: data.visible ?? true,
        order: (last?.order ?? -1) + 1,
      },
    });
  }

  audit({
    userId: user.id,
    action: `pricing.${kind}.create`,
    entity: "pricing",
    entityId: created.id,
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
