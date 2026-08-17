import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { logLeadActivity } from "@/lib/crm-server";
import {
  MAX_TOTAL_ATTACHMENT_BYTES,
  sendEmail,
  type MailAttachment,
} from "@/lib/email";
import { getChannelsConfig } from "@/lib/channels-config-server";
import { readStoredFile } from "@/lib/storage";
import { clientIp } from "@/lib/rate-limit";
import { absUrl } from "@/lib/site";
import { quoteRef } from "@/lib/quotations";

type Params = { params: Promise<{ id: string }> };

const Schema = z.object({
  toAddress: z.string().trim().email().max(200).optional(),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(8000),
  /* Ids of files attached to THIS quotation — never a filename or a URL, so a
     caller cannot name an arbitrary path or host and have the server read it.
     Same contract as the lead composer. */
  attachmentIds: z.array(z.string().max(60)).max(10).default([]),
});

/** ~22 url-safe chars, matching newToken() in lib/outreach-server. */
const newToken = () => randomBytes(16).toString("base64url");

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Email a quotation to its client.
 *
 * This is the action "Mark sent" only ever pretended to be. The status is
 * moved ONLY after the provider accepts the message, because a status that
 * claims a delivery which never happened is the bug this replaces.
 */
export async function POST(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("quotes.manage");
  if (error) return error;
  const { id } = await params;

  const quote = await db.quotation.findUnique({ where: { id } });
  if (!quote) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const to = d.toAddress ?? quote.clientEmail ?? "";
  if (!to) {
    return NextResponse.json(
      { ok: false, error: "This quotation has no client email address." },
      { status: 400 },
    );
  }
  if (quote.status === "SUPERSEDED") {
    return NextResponse.json(
      { ok: false, error: "This version has been superseded — send the current revision instead." },
      { status: 409 },
    );
  }
  // Same composer gate the lead email honours; transactional mail is separate.
  if (!(await getChannelsConfig()).email.enabled) {
    return NextResponse.json(
      { ok: false, error: "Email messaging is turned off in Channels." },
      { status: 400 },
    );
  }

  /* Resolve attachments before anything is written, so a bad set costs nothing
     but an error message. */
  const attachments: MailAttachment[] = [];
  if (d.attachmentIds.length > 0) {
    const rows = await db.attachment.findMany({
      where: { id: { in: d.attachmentIds }, quotationId: id },
    });
    if (rows.length !== d.attachmentIds.length) {
      return NextResponse.json(
        { ok: false, error: "One of those files is no longer attached to this quotation." },
        { status: 400 },
      );
    }
    const totalBytes = rows.reduce((n, r) => n + r.size, 0);
    if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
      const mb = (n: number) => (n / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        {
          ok: false,
          error: `Attachments total ${mb(totalBytes)} MB — the limit is ${mb(MAX_TOTAL_ATTACHMENT_BYTES)} MB per email.`,
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

  /* Mint the token once and reuse it on every resend, so "viewed" keeps
     meaning "the client opened the quotation" instead of resetting each time
     we chase them.

     Generated here but NOT persisted until the send succeeds. Writing it first
     was wrong twice over: a failed send would leave state behind, and — worse
     — a DRAFT would end up with a live /q/<token> that anyone holding the link
     could read, for a quotation we never sent. */
  const token = quote.publicToken ?? newToken();
  const url = absUrl(`/q/${token}`);
  const ref = quoteRef(quote.number, quote.version);

  const html = `<div style="font-family:system-ui,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1c1917">
${esc(d.body).replace(/\n/g, "<br />")}
<p style="margin:24px 0"><a href="${url}" style="background:#F26419;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:700;display:inline-block">View quotation ${esc(ref)}</a></p>
<p style="font-size:13px;color:#78716c">Or paste this into your browser:<br />${esc(url)}</p>
</div>`;
  const text = `${d.body}\n\nView your quotation (${ref}):\n${url}\n`;

  const result = await sendEmail({
    to: [to],
    subject: d.subject,
    text,
    html,
    ...(attachments.length ? { attachments } : {}),
  });

  if (!result.ok) {
    /* Deliberately no CommLog row and no status change. The whole point of
       this route is that "Sent" means an email actually left. */
    return NextResponse.json(
      { ok: false, error: result.error ?? "Email failed to send." },
      { status: 502 },
    );
  }

  if (!quote.publicToken) {
    await db.quotation.update({ where: { id }, data: { publicToken: token } });
  }

  await db.commLog.create({
    data: {
      leadId: quote.leadId,
      quotationId: id,
      channel: "EMAIL",
      toAddress: to,
      subject: d.subject,
      body: d.body,
      status: "SENT",
      attachments: attachments.map((a) => a.filename),
      userId: user.id,
      userName: user.name,
    },
  });

  /* DRAFT and APPROVED are the only states a send advances. A resend of an
     already-SENT quotation stays SENT — TRANSITIONS in status/route.ts has no
     SENT → SENT edge and must not gain one. */
  const advances = quote.status === "DRAFT" || quote.status === "APPROVED";
  if (advances) {
    await db.quotation.update({ where: { id }, data: { status: "SENT" } });
  }

  if (quote.leadId) {
    void logLeadActivity({
      leadId: quote.leadId,
      userId: user.id,
      userName: user.name,
      type: "quotation",
      message: `Quotation ${ref} emailed to ${to}`,
    });
  }
  audit({
    userId: user.id,
    action: "quotation.send",
    entity: "quotation",
    entityId: id,
    meta: { to, ref, files: attachments.length, advanced: advances },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, status: advances ? "SENT" : quote.status, url });
}

/** Send history for the editor: every email that carried this quotation,
    plus whether the client has opened the link. */
export async function GET(_req: Request, { params }: Params) {
  const { error } = await requirePermission("quotes.manage");
  if (error) return error;
  const { id } = await params;

  const quote = await db.quotation.findUnique({
    where: { id },
    select: { publicToken: true, viewedAt: true },
  });
  if (!quote) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const sends = await db.commLog.findMany({
    where: { quotationId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true, toAddress: true, subject: true, status: true, openedAt: true,
      attachments: true, userName: true, createdAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    sends,
    viewedAt: quote.viewedAt,
    url: quote.publicToken ? absUrl(`/q/${quote.publicToken}`) : null,
  });
}
