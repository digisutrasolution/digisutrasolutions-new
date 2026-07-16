import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { CategorySchema } from "@/lib/catalog-admin";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

const PatchSchema = CategorySchema.partial().extend({
  moveTo: z.number().int().min(0).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission("services.manage");
  if (error) return error;
  const { id } = await params;

  const existing = await db.serviceCategory.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const { moveTo, ...d } = parsed.data;

  if (d.slug && d.slug !== existing.slug) {
    if (await db.serviceCategory.findUnique({ where: { slug: d.slug } })) {
      return NextResponse.json({ ok: false, error: "Slug already exists." }, { status: 400 });
    }
  }

  const category = await db.serviceCategory.update({
    where: { id },
    data: {
      ...(d.slug !== undefined ? { slug: d.slug } : {}),
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.blurb !== undefined ? { blurb: d.blurb } : {}),
      ...(d.intro !== undefined ? { intro: d.intro } : {}),
      ...(d.icon !== undefined ? { icon: d.icon } : {}),
      ...(d.badge !== undefined ? { badge: d.badge } : {}),
      ...(d.image !== undefined ? { image: d.image } : {}),
      ...(d.stat !== undefined ? { stat: d.stat } : {}),
      ...(d.statLabel !== undefined ? { statLabel: d.statLabel } : {}),
      ...(d.priceFrom !== undefined ? { priceFrom: d.priceFrom } : {}),
      ...(d.marketNote !== undefined ? { marketNote: d.marketNote } : {}),
      ...(d.visible !== undefined ? { visible: d.visible } : {}),
    },
  });

  if (moveTo !== undefined) {
    const all = await db.serviceCategory.findMany({ orderBy: { order: "asc" } });
    const rest = all.filter((c) => c.id !== id);
    rest.splice(Math.min(moveTo, rest.length), 0, category);
    await db.$transaction(
      rest.map((c, i) => db.serviceCategory.update({ where: { id: c.id }, data: { order: i } })),
    );
  }

  audit({
    userId: user.id,
    action: "service.category.update",
    entity: "serviceCategory",
    entityId: id,
    meta: { slug: category.slug },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, category });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission("services.manage");
  if (error) return error;
  const { id } = await params;

  const existing = await db.serviceCategory.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  await db.serviceCategory.delete({ where: { id } }); // offers cascade

  audit({
    userId: user.id,
    action: "service.category.delete",
    entity: "serviceCategory",
    entityId: id,
    meta: { slug: existing.slug },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
