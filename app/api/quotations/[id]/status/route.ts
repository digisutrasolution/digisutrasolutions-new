import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { logLeadActivity } from "@/lib/crm-server";
import { QUOTATION_STATUSES, quoteStatusLabel } from "@/lib/quotations";

type Params = { params: Promise<{ id: string }> };

const Schema = z.object({ status: z.enum(QUOTATION_STATUSES) });

// Legal next states from each status.
const TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["PENDING_APPROVAL", "SENT", "EXPIRED"],
  PENDING_APPROVAL: ["APPROVED", "REJECTED", "DRAFT"],
  APPROVED: ["SENT", "DRAFT", "EXPIRED"],
  SENT: ["ACCEPTED", "REJECTED", "EXPIRED"],
  REJECTED: ["DRAFT"],
  EXPIRED: ["DRAFT"],
  ACCEPTED: [],
  SUPERSEDED: [],
};

export async function POST(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("quotes.manage");
  if (error) return error;
  const { id } = await params;

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 });
  }
  const target = parsed.data.status;

  const quote = await db.quotation.findUnique({ where: { id } });
  if (!quote) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  if (!(TRANSITIONS[quote.status] ?? []).includes(target)) {
    return NextResponse.json(
      { ok: false, error: `Can't move a ${quoteStatusLabel(quote.status)} quotation to ${quoteStatusLabel(target)}.` },
      { status: 409 },
    );
  }

  // Approving (or rejecting a pending approval) needs the approver permission.
  const needsApprover = target === "APPROVED" || (target === "REJECTED" && quote.status === "PENDING_APPROVAL");
  if (needsApprover && !user.permissions.includes("quotes.approve")) {
    return NextResponse.json({ ok: false, error: "You don't have permission to approve quotations." }, { status: 403 });
  }

  const data: Prisma.QuotationUpdateInput = { status: target };
  if (target === "APPROVED") {
    data.approvedById = user.id;
    data.approvedByName = user.name;
    data.approvedAt = new Date();
  } else if (target === "DRAFT") {
    data.approvedById = null;
    data.approvedByName = null;
    data.approvedAt = null;
  }

  const updated = await db.quotation.update({ where: { id }, data });

  if (quote.leadId) {
    void logLeadActivity({
      leadId: quote.leadId,
      userId: user.id,
      userName: user.name,
      type: "quotation",
      message: `Quotation ${quote.number} → ${quoteStatusLabel(target)}`,
    });
  }
  audit({ userId: user.id, action: "quotation.status", entity: "quotation", entityId: id, meta: { from: quote.status, to: target }, ip: clientIp(req) });
  return NextResponse.json({ ok: true, quote: updated });
}
