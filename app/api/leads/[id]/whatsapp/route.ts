import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { canSeeAllLeads } from "@/lib/auth/rbac";
import { logLeadActivity } from "@/lib/crm-server";
import { getChannelsConfig } from "@/lib/channels-config-server";

type Params = { params: Promise<{ id: string }> };

const Schema = z.object({
  body: z.string().trim().min(1).max(8000),
  templateId: z.string().nullable().optional(),
});

/** Record a WhatsApp message the agent is sending via the pre-filled wa.me
    link. Delivery can't be confirmed without the Business API, so this simply
    logs intent to the timeline + comms history. */
export async function POST(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;
  const { id } = await params;

  const lead = await db.lead.findFirst({ where: { id, deletedAt: null } });
  if (!lead || (!canSeeAllLeads(user) && lead.assignedToId !== user.id)) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });
  }

  if (!(await getChannelsConfig()).whatsapp.enabled) {
    return NextResponse.json({ ok: false, error: "WhatsApp messaging is turned off in Channels." }, { status: 400 });
  }

  await db.commLog.create({
    data: {
      leadId: id,
      channel: "WHATSAPP",
      templateId: parsed.data.templateId ?? null,
      toAddress: lead.whatsapp,
      body: parsed.data.body,
      status: "SENT",
      userId: user.id,
      userName: user.name,
    },
  });
  void logLeadActivity({ leadId: id, userId: user.id, userName: user.name, type: "whatsapp", message: "WhatsApp message sent" });
  return NextResponse.json({ ok: true });
}
