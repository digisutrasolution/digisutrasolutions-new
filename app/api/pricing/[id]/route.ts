import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { MatrixRowSchema, PlanSchema, RateRowSchema } from "@/lib/catalog-admin";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

const KIND = z.enum(["plan", "matrix", "rate"]);
const move = { moveTo: z.number().int().min(0).optional() };

const PATCH_SCHEMAS = {
  plan: PlanSchema.partial().extend(move),
  matrix: MatrixRowSchema.partial().extend(move),
  rate: RateRowSchema.partial().extend(move),
} as const;

function table(kind: z.infer<typeof KIND>) {
  if (kind === "plan") return db.pricingPlan;
  if (kind === "matrix") return db.pricingRow;
  return db.rateCardRow;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission("pricing.manage");
  if (error) return error;
  const { id } = await params;

  const kindParsed = KIND.safeParse(new URL(req.url).searchParams.get("kind"));
  if (!kindParsed.success) {
    return NextResponse.json({ ok: false, error: "kind must be plan|matrix|rate." }, { status: 400 });
  }
  const kind = kindParsed.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = table(kind) as any;

  const existing = await t.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = PATCH_SCHEMAS[kind].safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const { moveTo, ...fields } = parsed.data;

  const updated = await t.update({ where: { id }, data: fields });

  if (moveTo !== undefined) {
    const all = await t.findMany({ orderBy: { order: "asc" } });
    const rest = all.filter((r: { id: string }) => r.id !== id);
    rest.splice(Math.min(moveTo, rest.length), 0, updated);
    await db.$transaction(
      rest.map((r: { id: string }, i: number) =>
        t.update({ where: { id: r.id }, data: { order: i } }),
      ),
    );
  }

  audit({
    userId: user.id,
    action: `pricing.${kind}.update`,
    entity: "pricing",
    entityId: id,
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission("pricing.manage");
  if (error) return error;
  const { id } = await params;

  const kindParsed = KIND.safeParse(new URL(req.url).searchParams.get("kind"));
  if (!kindParsed.success) {
    return NextResponse.json({ ok: false, error: "kind must be plan|matrix|rate." }, { status: 400 });
  }
  const kind = kindParsed.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = table(kind) as any;

  const existing = await t.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  await t.delete({ where: { id } });

  audit({
    userId: user.id,
    action: `pricing.${kind}.delete`,
    entity: "pricing",
    entityId: id,
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
