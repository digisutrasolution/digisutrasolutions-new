import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { canSeeAllLeads } from "@/lib/auth/rbac";

type Params = { params: Promise<{ id: string }> };

/** Sent-message history for a lead (email + WhatsApp). */
export async function GET(_req: Request, { params }: Params) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;
  const { id } = await params;

  const lead = await db.lead.findFirst({ where: { id, deletedAt: null }, select: { assignedToId: true } });
  if (!lead || (!canSeeAllLeads(user) && lead.assignedToId !== user.id)) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const comms = await db.commLog.findMany({
    where: { leadId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, channel: true, subject: true, body: true, status: true, openedAt: true, toAddress: true, userName: true, createdAt: true },
  });
  return NextResponse.json({ ok: true, comms });
}
