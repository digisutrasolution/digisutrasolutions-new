import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { OfferSchema } from "@/lib/catalog-admin";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

const PatchSchema = OfferSchema.partial().extend({
  moveTo: z.number().int().min(0).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission("services.manage");
  if (error) return error;
  const { id } = await params;

  const existing = await db.serviceOffer.findUnique({ where: { id } });
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

  const offer = await db.serviceOffer.update({
    where: { id },
    data: {
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.blurb !== undefined ? { blurb: d.blurb } : {}),
      ...(d.highlight !== undefined ? { highlight: d.highlight } : {}),
      ...(d.visible !== undefined ? { visible: d.visible } : {}),
    },
  });

  if (moveTo !== undefined) {
    const siblings = await db.serviceOffer.findMany({
      where: { categoryId: existing.categoryId },
      orderBy: { order: "asc" },
    });
    const rest = siblings.filter((o) => o.id !== id);
    rest.splice(Math.min(moveTo, rest.length), 0, offer);
    await db.$transaction(
      rest.map((o, i) => db.serviceOffer.update({ where: { id: o.id }, data: { order: i } })),
    );
  }

  audit({
    userId: user.id,
    action: "service.offer.update",
    entity: "serviceOffer",
    entityId: id,
    meta: { name: offer.name },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, offer });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission("services.manage");
  if (error) return error;
  const { id } = await params;

  const existing = await db.serviceOffer.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  await db.serviceOffer.delete({ where: { id } });

  audit({
    userId: user.id,
    action: "service.offer.delete",
    entity: "serviceOffer",
    entityId: id,
    meta: { name: existing.name },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
