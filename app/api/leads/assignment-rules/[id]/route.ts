import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { RuleSchema } from "../route";

type Params = { params: Promise<{ id: string }> };

// Any subset of a rule's fields may be sent (e.g. just { enabled } or { order }).
const PatchSchema = RuleSchema.partial();

export async function PATCH(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;
  const { id } = await params;

  const existing = await db.assignmentRule.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  if (d.targetUserIds) {
    const users = await db.user.findMany({ where: { id: { in: d.targetUserIds } }, select: { id: true } });
    if (users.length !== new Set(d.targetUserIds).size) {
      return NextResponse.json({ ok: false, error: "One or more target users don't exist." }, { status: 400 });
    }
  }

  // Changing the pool resets the round-robin cursor so it starts fresh.
  const rule = await db.assignmentRule.update({
    where: { id },
    data: { ...d, ...(d.targetUserIds ? { rrIndex: 0 } : {}) },
  });
  audit({ userId: user.id, action: "assignment-rule.update", entity: "assignment-rule", entityId: id, meta: { fields: Object.keys(d) }, ip: clientIp(req) });
  return NextResponse.json({ ok: true, rule });
}

export async function DELETE(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;
  const { id } = await params;

  const existing = await db.assignmentRule.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  await db.assignmentRule.delete({ where: { id } });
  audit({ userId: user.id, action: "assignment-rule.delete", entity: "assignment-rule", entityId: id, meta: { name: existing.name }, ip: clientIp(req) });
  return NextResponse.json({ ok: true });
}
