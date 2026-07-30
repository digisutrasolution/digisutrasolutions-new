import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { LEAD_STATUSES, statusLabel } from "@/lib/crm";

const Schema = z
  .object({
    ids: z.array(z.string()).min(1).max(300),
    assignedToId: z.string().nullable().optional(), // provided → (re)assign; null → unassign
    status: z.enum(LEAD_STATUSES).optional(),
  })
  .refine((v) => v.assignedToId !== undefined || v.status !== undefined, {
    message: "Nothing to change.",
  });

/** Bulk assign or bulk status-change for the selected leads. Powers bulk
    assignment and round-robin (the client calls this once per user). */
export async function POST(req: Request) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const { ids, assignedToId, status } = parsed.data;

  let assigneeName: string | null = null;
  if (assignedToId) {
    const u = await db.user.findUnique({ where: { id: assignedToId }, select: { name: true } });
    if (!u) return NextResponse.json({ ok: false, error: "Assignee not found." }, { status: 400 });
    assigneeName = u.name;
  }

  const data: { assignedToId?: string | null; status?: (typeof LEAD_STATUSES)[number] } = {};
  if (assignedToId !== undefined) data.assignedToId = assignedToId;
  if (status !== undefined) data.status = status;

  const result = await db.lead.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data,
  });

  // Timeline entry per lead so the history stays accurate.
  const activities: {
    leadId: string;
    userId: string;
    userName: string;
    type: string;
    message: string;
  }[] = [];
  for (const id of ids) {
    if (assignedToId !== undefined) {
      activities.push({
        leadId: id,
        userId: user.id,
        userName: user.name,
        type: "assigned",
        message: assigneeName ? `Assigned to ${assigneeName}` : "Unassigned",
      });
    }
    if (status !== undefined) {
      activities.push({
        leadId: id,
        userId: user.id,
        userName: user.name,
        type: "status",
        message: `Status set to ${statusLabel(status)}`,
      });
    }
  }
  if (activities.length) await db.leadActivity.createMany({ data: activities }).catch(() => {});

  audit({
    userId: user.id,
    action: "lead.bulk",
    entity: "lead",
    entityId: `${ids.length} leads`,
    meta: { count: result.count, assignedToId: assignedToId ?? undefined, status },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, count: result.count });
}
