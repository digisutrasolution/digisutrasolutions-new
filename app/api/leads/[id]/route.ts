import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { logLeadActivity } from "@/lib/crm-server";
import {
  LEAD_PRIORITIES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  priorityLabel,
  statusLabel,
} from "@/lib/crm";

type Params = { params: Promise<{ id: string }> };

const str = (max: number) => z.string().trim().max(max).nullable().optional();

const PatchSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  priority: z.enum(LEAD_PRIORITIES).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  assignedToId: z.string().nullable().optional(),
  verified: z.boolean().optional(),
  score: z.number().int().min(0).max(100).nullable().optional(),
  expectedRevenue: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
  tags: z.array(z.string().trim().max(40)).max(20).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  company: str(120),
  industry: str(120),
  email: str(200),
  whatsapp: z.string().trim().max(30).optional(),
  website: str(300),
  country: str(80),
  state: str(80),
  city: str(80),
  address: str(300),
  budget: str(60),
  timeline: str(60),
  message: str(4000),
  notes: str(2000),
});

/** Full lead record + its activity timeline. */
export async function GET(_req: Request, { params }: Params) {
  const { error } = await requirePermission("leads.manage");
  if (error) return error;
  const { id } = await params;

  const lead = await db.lead.findFirst({
    where: { id, deletedAt: null },
    include: {
      assignedTo: { select: { id: true, name: true } },
      activities: { orderBy: { createdAt: "desc" }, take: 200 },
    },
  });
  if (!lead) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, lead });
}

export async function PATCH(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;
  const { id } = await params;

  const existing = await db.lead.findFirst({ where: { id, deletedAt: null } });
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
  const data = parsed.data;

  // Validate the assignee exists (null clears the assignment).
  let assigneeName: string | null = null;
  if (data.assignedToId) {
    const u = await db.user.findUnique({
      where: { id: data.assignedToId },
      select: { name: true },
    });
    if (!u) {
      return NextResponse.json(
        { ok: false, error: "Assignee not found." },
        { status: 400 },
      );
    }
    assigneeName = u.name;
  }

  const lead = await db.lead.update({ where: { id }, data });

  // Timeline: log the meaningful transitions explicitly, other edits once.
  const who = { userId: user.id, userName: user.name };
  if (data.status && data.status !== existing.status) {
    void logLeadActivity({
      ...who,
      leadId: id,
      type: "status",
      message: `Status: ${statusLabel(existing.status)} → ${statusLabel(data.status)}`,
    });
  }
  if (data.priority && data.priority !== existing.priority) {
    void logLeadActivity({
      ...who,
      leadId: id,
      type: "priority",
      message: `Priority set to ${priorityLabel(data.priority)}`,
    });
  }
  if (data.assignedToId !== undefined && data.assignedToId !== existing.assignedToId) {
    void logLeadActivity({
      ...who,
      leadId: id,
      type: "assigned",
      message: assigneeName ? `Assigned to ${assigneeName}` : "Unassigned",
    });
  }
  const otherEdited = Object.keys(data).some(
    (k) => !["status", "priority", "assignedToId"].includes(k),
  );
  if (otherEdited) {
    void logLeadActivity({ ...who, leadId: id, type: "updated", message: "Details updated" });
  }

  audit({
    userId: user.id,
    action: "lead.update",
    entity: "lead",
    entityId: id,
    meta: { fields: Object.keys(data) },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, lead });
}

/** Soft delete — the row is hidden, never physically removed. */
export async function DELETE(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;
  const { id } = await params;

  const existing = await db.lead.findFirst({ where: { id, deletedAt: null } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  await db.lead.update({ where: { id }, data: { deletedAt: new Date() } });
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
