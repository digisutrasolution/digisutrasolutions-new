import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/guards";
import { userCan, canSeeAllLeads } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { deleteStoredFile } from "@/lib/storage";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, { params }: Params) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const att = await db.attachment.findUnique({ where: { id }, include: { lead: { select: { assignedToId: true, deletedAt: true } } } });
  if (!att) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  // Same permission + scope gate as the owning entity.
  if (att.leadId) {
    if (!userCan(user, "leads.manage")) return NextResponse.json({ ok: false, error: "You don't have permission." }, { status: 403 });
    if (att.lead && !canSeeAllLeads(user) && att.lead.assignedToId !== user.id) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  } else if (att.quotationId) {
    if (!userCan(user, "quotes.manage")) return NextResponse.json({ ok: false, error: "You don't have permission." }, { status: 403 });
  }

  await deleteStoredFile(att.filename, att.url);
  await db.attachment.delete({ where: { id } });
  audit({ userId: user.id, action: "attachment.delete", entity: "attachment", entityId: id, meta: { name: att.originalName }, ip: clientIp(req) });
  return NextResponse.json({ ok: true });
}
