import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { FaqSchema } from "@/lib/faq-admin";
import { clientIp } from "@/lib/rate-limit";

const PatchSchema = FaqSchema.partial().extend({
  moveTo: z.number().int().min(0).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission("faq.manage");
  if (error) return error;
  const { id } = await params;

  const existing = await db.faqItem.findUnique({ where: { id } });
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

  const faq = await db.faqItem.update({
    where: { id },
    data: {
      ...(d.question !== undefined ? { question: d.question } : {}),
      ...(d.lead !== undefined ? { lead: d.lead } : {}),
      ...(d.rest !== undefined ? { rest: d.rest } : {}),
      ...(d.category !== undefined ? { category: d.category } : {}),
      ...(d.icon !== undefined ? { icon: d.icon } : {}),
      ...(d.featured !== undefined ? { featured: d.featured } : {}),
      ...(d.visible !== undefined ? { visible: d.visible } : {}),
    },
  });

  if (moveTo !== undefined) {
    const siblings = await db.faqItem.findMany({ orderBy: { order: "asc" } });
    const rest = siblings.filter((f) => f.id !== id);
    rest.splice(Math.min(moveTo, rest.length), 0, faq);
    await db.$transaction(
      rest.map((f, i) => db.faqItem.update({ where: { id: f.id }, data: { order: i } })),
    );
  }

  audit({
    userId: user.id,
    action: "faq.update",
    entity: "faqItem",
    entityId: id,
    meta: { question: faq.question },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, faq });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission("faq.manage");
  if (error) return error;
  const { id } = await params;

  const existing = await db.faqItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  await db.faqItem.delete({ where: { id } });

  audit({
    userId: user.id,
    action: "faq.delete",
    entity: "faqItem",
    entityId: id,
    meta: { question: existing.question },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
