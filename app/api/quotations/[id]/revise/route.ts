import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

/** Clone a quotation into a new editable DRAFT version: same number, version+1,
    parentId set. The source is marked SUPERSEDED so only the latest is live. */
export async function POST(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("quotes.manage");
  if (error) return error;
  const { id } = await params;

  const src = await db.quotation.findUnique({ where: { id } });
  if (!src) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const revision = await db.$transaction(async (tx) => {
    // Next version is max version across this number + 1.
    const siblings = await tx.quotation.findMany({
      where: { number: src.number },
      select: { version: true },
    });
    const nextVersion = Math.max(...siblings.map((s) => s.version), src.version) + 1;

    await tx.quotation.update({ where: { id }, data: { status: "SUPERSEDED" } });

    return tx.quotation.create({
      data: {
        number: src.number,
        version: nextVersion,
        parentId: src.id,
        leadId: src.leadId,
        clientName: src.clientName,
        clientCompany: src.clientCompany,
        clientEmail: src.clientEmail,
        clientPhone: src.clientPhone,
        clientAddress: src.clientAddress,
        clientGstin: src.clientGstin,
        title: src.title,
        notes: src.notes,
        currency: src.currency,
        items: src.items ?? [],
        discountPct: src.discountPct,
        taxRatePct: src.taxRatePct,
        taxMode: src.taxMode,
        subtotal: src.subtotal,
        discountAmount: src.discountAmount,
        taxAmount: src.taxAmount,
        total: src.total,
        validUntil: src.validUntil,
        status: "DRAFT",
        createdById: user.id,
        createdByName: user.name,
      },
    });
  });

  audit({ userId: user.id, action: "quotation.revise", entity: "quotation", entityId: revision.id, meta: { number: src.number, version: revision.version }, ip: clientIp(req) });
  return NextResponse.json({ ok: true, id: revision.id, version: revision.version }, { status: 201 });
}
