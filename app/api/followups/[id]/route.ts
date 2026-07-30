import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { logLeadActivity } from "@/lib/crm-server";
import { FOLLOWUP_STATUSES, FOLLOWUP_TYPES, followUpTypeLabel } from "@/lib/crm";

type Params = { params: Promise<{ id: string }> };

const Schema = z.object({
  status: z.enum(FOLLOWUP_STATUSES).optional(),
  type: z.enum(FOLLOWUP_TYPES).optional(),
  title: z.string().trim().min(1).max(160).optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  dueAt: z.string().datetime().optional(),
  ownerId: z.string().nullable().optional(),
});

const dueLabel = (d: Date) =>
  d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export async function PATCH(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;
  const { id } = await params;

  const existing = await db.followUp.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const data: Prisma.FollowUpUpdateInput = {};
  if (d.type !== undefined) data.type = d.type;
  if (d.title !== undefined) data.title = d.title;
  if (d.notes !== undefined) data.notes = d.notes;
  if (d.ownerId !== undefined) {
    if (d.ownerId) {
      const u = await db.user.findUnique({ where: { id: d.ownerId }, select: { id: true } });
      if (!u) return NextResponse.json({ ok: false, error: "Owner not found." }, { status: 400 });
    }
    data.owner = d.ownerId ? { connect: { id: d.ownerId } } : { disconnect: true };
  }

  // Rescheduling re-arms the reminder/escalation stamps for the new time.
  if (d.dueAt !== undefined) {
    data.dueAt = new Date(d.dueAt);
    data.reminderSentAt = null;
    data.escalatedAt = null;
  }

  if (d.status !== undefined && d.status !== existing.status) {
    data.status = d.status;
    data.completedAt = d.status === "DONE" ? new Date() : null;
  }

  const followUp = await db.followUp.update({
    where: { id },
    data,
    include: { owner: { select: { id: true, name: true } } },
  });

  // Timeline entries for the meaningful transitions.
  const who = { userId: user.id, userName: user.name };
  if (d.status === "DONE" && existing.status !== "DONE") {
    void logLeadActivity({ ...who, leadId: existing.leadId, type: "followup", message: `Follow-up completed — ${existing.title}` });
  } else if (d.status === "CANCELLED" && existing.status !== "CANCELLED") {
    void logLeadActivity({ ...who, leadId: existing.leadId, type: "followup", message: `Follow-up cancelled — ${existing.title}` });
  } else if (d.dueAt && new Date(d.dueAt).getTime() !== existing.dueAt.getTime()) {
    void logLeadActivity({ ...who, leadId: existing.leadId, type: "followup", message: `${followUpTypeLabel(followUp.type)} follow-up rescheduled to ${dueLabel(new Date(d.dueAt))}` });
  }

  audit({
    userId: user.id,
    action: "followup.update",
    entity: "followup",
    entityId: id,
    meta: { fields: Object.keys(d) },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, followUp });
}

/** Hard delete — follow-ups are lightweight and carry no history of their own
    (the lead timeline keeps the trail). */
export async function DELETE(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;
  const { id } = await params;

  const existing = await db.followUp.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  await db.followUp.delete({ where: { id } });
  audit({
    userId: user.id,
    action: "followup.delete",
    entity: "followup",
    entityId: id,
    meta: { leadId: existing.leadId },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
