import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/guards";
import { userCan, canSeeAllLeads } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { saveUpload } from "@/lib/storage";
import { logLeadActivity } from "@/lib/crm-server";

export const runtime = "nodejs";
const MAX_SIZE = 15 * 1024 * 1024; // 15 MB

// Documents + images the team actually shares. SVG/HTML/scripts are excluded —
// they can execute; the sandbox CSP on /uploads is only the second line.
const ALLOWED = new Set([
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "csv", "txt",
  "png", "jpg", "jpeg", "gif", "webp", "zip", "rtf", "odt", "ods",
]);
const extOf = (name: string) => (name.split(".").pop() ?? "").toLowerCase();

/** List attachments for a lead or a quotation. */
export async function GET(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const p = new URL(req.url).searchParams;
  const leadId = p.get("leadId");
  const quotationId = p.get("quotationId");

  const where: Prisma.AttachmentWhereInput = {};
  if (leadId) {
    if (!userCan(user, "leads.manage")) return forbidden();
    const lead = await db.lead.findFirst({ where: { id: leadId, deletedAt: null }, select: { assignedToId: true } });
    if (!lead || (!canSeeAllLeads(user) && lead.assignedToId !== user.id)) return notFound();
    where.leadId = leadId;
  } else if (quotationId) {
    if (!userCan(user, "quotes.manage")) return forbidden();
    where.quotationId = quotationId;
  } else {
    return NextResponse.json({ ok: false, error: "leadId or quotationId required." }, { status: 400 });
  }

  const attachments = await db.attachment.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ ok: true, attachments });
}

/** Upload a file (multipart) and attach it to a lead or a quotation. */
export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "Invalid form." }, { status: 400 });

  const leadId = (form.get("leadId") as string) || null;
  const quotationId = (form.get("quotationId") as string) || null;
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "No file." }, { status: 400 });

  if (leadId) {
    if (!userCan(user, "leads.manage")) return forbidden();
    const lead = await db.lead.findFirst({ where: { id: leadId, deletedAt: null }, select: { assignedToId: true } });
    if (!lead || (!canSeeAllLeads(user) && lead.assignedToId !== user.id)) return notFound();
  } else if (quotationId) {
    if (!userCan(user, "quotes.manage")) return forbidden();
    const q = await db.quotation.findUnique({ where: { id: quotationId }, select: { id: true } });
    if (!q) return notFound();
  } else {
    return NextResponse.json({ ok: false, error: "leadId or quotationId required." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) return NextResponse.json({ ok: false, error: "File is larger than 15 MB." }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ ok: false, error: "File is empty." }, { status: 400 });
  if (!ALLOWED.has(extOf(file.name))) {
    return NextResponse.json({ ok: false, error: "That file type isn't allowed." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await saveUpload(buffer, file.name, file.type || "application/octet-stream");

  const attachment = await db.attachment.create({
    data: {
      leadId, quotationId,
      filename: stored.filename,
      originalName: file.name.slice(0, 200),
      mimeType: stored.mimeType,
      size: stored.size,
      url: stored.url,
      uploadedById: user.id,
      uploadedByName: user.name,
    },
  });

  if (leadId) {
    void logLeadActivity({ leadId, userId: user.id, userName: user.name, type: "file", message: `Attached ${attachment.originalName}` });
  }
  audit({ userId: user.id, action: "attachment.create", entity: "attachment", entityId: attachment.id, meta: { leadId, quotationId, name: attachment.originalName }, ip: clientIp(req) });
  return NextResponse.json({ ok: true, attachment }, { status: 201 });
}

const forbidden = () => NextResponse.json({ ok: false, error: "You don't have permission." }, { status: 403 });
const notFound = () => NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
