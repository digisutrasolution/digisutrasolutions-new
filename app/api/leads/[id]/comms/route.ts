import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { canSeeAllLeads } from "@/lib/auth/rbac";
import { getChannelsConfig, channelsAvailability } from "@/lib/channels-config-server";

type Params = { params: Promise<{ id: string }> };

/** Sent-message history for a lead (all channels) + which channels are live. */
export async function GET(_req: Request, { params }: Params) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;
  const { id } = await params;

  const lead = await db.lead.findFirst({ where: { id, deletedAt: null }, select: { assignedToId: true } });
  if (!lead || (!canSeeAllLeads(user) && lead.assignedToId !== user.id)) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const [comms, avail] = await Promise.all([
    db.commLog.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, channel: true, subject: true, body: true, status: true, attachments: true, openedAt: true, toAddress: true, userName: true, createdAt: true },
    }),
    channelsAvailability(await getChannelsConfig()),
  ]);
  return NextResponse.json({
    ok: true,
    comms,
    channels: {
      email: avail.emailSend,
      whatsapp: avail.whatsappSend,
      sms: avail.smsSend,
      telegram: avail.telegramDeepLink,
    },
  });
}
