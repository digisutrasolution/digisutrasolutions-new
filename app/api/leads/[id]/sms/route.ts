import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { canSeeAllLeads } from "@/lib/auth/rbac";
import { logLeadActivity } from "@/lib/crm-server";
import { getChannelsConfig } from "@/lib/channels-config-server";
import { getOtpConfig } from "@/lib/otp-config-server";
import { sendSms, smsGatewayReady } from "@/lib/sms";

type Params = { params: Promise<{ id: string }> };

const Schema = z.object({
  body: z.string().trim().min(1).max(1000),
  templateId: z.string().nullable().optional(),
});

/** Send an SMS to a lead through the shared HTTP gateway (the one configured
    for OTP under Verification), then log it to the timeline + comms history. */
export async function POST(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("leads.manage");
  if (error) return error;
  const { id } = await params;

  const lead = await db.lead.findFirst({ where: { id, deletedAt: null } });
  if (!lead || (!canSeeAllLeads(user) && lead.assignedToId !== user.id)) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });

  const channels = await getChannelsConfig();
  const otpCfg = await getOtpConfig();
  if (!channels.sms.enabled) return NextResponse.json({ ok: false, error: "SMS messaging is turned off in Channels." }, { status: 400 });
  if (!smsGatewayReady(otpCfg)) return NextResponse.json({ ok: false, error: "SMS gateway isn't configured (Verification → SMS)." }, { status: 400 });
  const to = (lead.whatsapp ?? "").replace(/[\s-]/g, "");
  if (!to || to === "—") return NextResponse.json({ ok: false, error: "This lead has no phone number." }, { status: 400 });

  const res = await sendSms({ to, text: parsed.data.body }, otpCfg);

  await db.commLog.create({
    data: {
      leadId: id,
      channel: "SMS",
      templateId: parsed.data.templateId ?? null,
      toAddress: to,
      body: parsed.data.body,
      status: res.ok ? "SENT" : "FAILED",
      userId: user.id,
      userName: user.name,
    },
  });
  void logLeadActivity({
    leadId: id,
    userId: user.id,
    userName: user.name,
    type: "sms",
    message: res.ok ? "SMS sent" : "SMS failed to send",
  });

  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 502 });
  return NextResponse.json({ ok: true });
}
