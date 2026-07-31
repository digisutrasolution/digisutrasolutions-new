import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { canSeeAllLeads } from "@/lib/auth/rbac";
import { logLeadActivity } from "@/lib/crm-server";
import { sendEmail } from "@/lib/email";
import { absUrl } from "@/lib/site";

type Params = { params: Promise<{ id: string }> };

const Schema = z.object({
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(8000),
  templateId: z.string().nullable().optional(),
  toAddress: z.string().trim().email().max(200).optional(),
});

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Send an email to a lead (final subject/body already rendered client-side),
    log it, and embed an open-tracking pixel. */
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
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const d = parsed.data;
  const to = d.toAddress ?? lead.email ?? "";
  if (!to) {
    return NextResponse.json({ ok: false, error: "This lead has no email address." }, { status: 400 });
  }

  // Log first so the tracking pixel can key on the row's trackId.
  const log = await db.commLog.create({
    data: {
      leadId: id,
      channel: "EMAIL",
      templateId: d.templateId ?? null,
      toAddress: to,
      subject: d.subject,
      body: d.body,
      status: "SENT",
      userId: user.id,
      userName: user.name,
    },
  });

  const pixel = `<img src="${absUrl(`/api/track/email-open?t=${log.trackId}`)}" width="1" height="1" alt="" style="display:none" />`;
  const html = `<div style="font-family:system-ui,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1c1917">${esc(d.body).replace(/\n/g, "<br />")}</div>${pixel}`;

  const result = await sendEmail({
    to: [to],
    subject: d.subject,
    text: d.body,
    html,
    ...(lead.email ? { replyTo: lead.email } : {}),
  });

  if (!result.ok) {
    await db.commLog.update({ where: { id: log.id }, data: { status: "FAILED" } });
    return NextResponse.json({ ok: false, error: result.error ?? "Email failed to send." }, { status: 502 });
  }

  void logLeadActivity({ leadId: id, userId: user.id, userName: user.name, type: "email", message: `Email sent: ${d.subject}` });
  return NextResponse.json({ ok: true });
}
