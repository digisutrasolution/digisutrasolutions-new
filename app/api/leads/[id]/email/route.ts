import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { canSeeAllLeads } from "@/lib/auth/rbac";
import { logLeadActivity } from "@/lib/crm-server";
import {
  MAX_TOTAL_ATTACHMENT_BYTES,
  sendEmail,
  type MailAttachment,
} from "@/lib/email";
import { getChannelsConfig } from "@/lib/channels-config-server";
import { readStoredFile } from "@/lib/storage";
import { absUrl } from "@/lib/site";

type Params = { params: Promise<{ id: string }> };

const Schema = z.object({
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(8000),
  templateId: z.string().nullable().optional(),
  toAddress: z.string().trim().email().max(200).optional(),
  /* Ids of files already attached to THIS lead — never a filename or a URL.
     The route resolves each id against the lead's own rows, so a caller cannot
     name an arbitrary path or host and have the server read or fetch it. */
  attachmentIds: z.array(z.string().max(60)).max(10).default([]),
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
  // Composer-only gate — transactional email (OTP, notifications, auto-replies)
  // goes through sendEmail directly and is unaffected by this toggle.
  if (!(await getChannelsConfig()).email.enabled) {
    return NextResponse.json({ ok: false, error: "Email messaging is turned off in Channels." }, { status: 400 });
  }

  /* Resolve attachments BEFORE logging the send. Everything that can fail
     cheaply — a missing file, an oversized set — should fail before a CommLog
     row exists, so the history never shows a "sent" message that never left. */
  const attachments: MailAttachment[] = [];
  if (d.attachmentIds.length > 0) {
    const rows = await db.attachment.findMany({
      // leadId scopes the lookup: an id belonging to another lead, or to a
      // quotation, simply does not come back.
      where: { id: { in: d.attachmentIds }, leadId: id },
    });
    if (rows.length !== d.attachmentIds.length) {
      return NextResponse.json(
        { ok: false, error: "One of those files is no longer attached to this lead." },
        { status: 400 },
      );
    }
    const totalBytes = rows.reduce((n, r) => n + r.size, 0);
    if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
      const mb = (n: number) => (n / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        {
          ok: false,
          error: `Attachments total ${mb(totalBytes)} MB — the limit is ${mb(MAX_TOTAL_ATTACHMENT_BYTES)} MB per email. Send the largest as a link instead.`,
        },
        { status: 400 },
      );
    }
    for (const r of rows) {
      const content = await readStoredFile(r.filename, r.url);
      if (!content) {
        return NextResponse.json(
          { ok: false, error: `"${r.originalName}" could not be read — re-upload it and try again.` },
          { status: 400 },
        );
      }
      attachments.push({
        filename: r.originalName,
        content,
        contentType: r.mimeType || "application/octet-stream",
      });
    }
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
      attachments: attachments.map((a) => a.filename),
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
    ...(attachments.length ? { attachments } : {}),
  });

  if (!result.ok) {
    await db.commLog.update({ where: { id: log.id }, data: { status: "FAILED" } });
    return NextResponse.json({ ok: false, error: result.error ?? "Email failed to send." }, { status: 502 });
  }

  const withFiles = attachments.length
    ? ` (${attachments.length} ${attachments.length === 1 ? "file" : "files"}: ${attachments.map((a) => a.filename).join(", ")})`
    : "";
  void logLeadActivity({ leadId: id, userId: user.id, userName: user.name, type: "email", message: `Email sent: ${d.subject}${withFiles}` });
  return NextResponse.json({ ok: true });
}
