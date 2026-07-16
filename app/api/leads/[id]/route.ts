import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

const PatchSchema = z.object({
  status: z.enum(["NEW", "VERIFIED", "QUALIFIED", "WON", "LOST"]).optional(),
  verified: z.boolean().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;
  const { id } = await params;

  const existing = await db.lead.findUnique({ where: { id } });
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

  const lead = await db.lead.update({ where: { id }, data: parsed.data });
  audit({
    userId: user.id,
    action: "lead.update",
    entity: "lead",
    entityId: id,
    meta: parsed.data,
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, lead });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;
  const { id } = await params;

  const existing = await db.lead.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  await db.lead.delete({ where: { id } });
  audit({
    userId: user.id,
    action: "lead.delete",
    entity: "lead",
    entityId: id,
    meta: { name: existing.name },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
