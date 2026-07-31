import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { QuoteInputSchema, totalsFor } from "../route";
import type { QuoteItem } from "@/lib/quotations";

type Params = { params: Promise<{ id: string }> };

const PatchSchema = QuoteInputSchema.partial();

// Statuses in which the document may still be edited in place; anything past
// approval must be revised into a new version instead.
const EDITABLE = new Set(["DRAFT", "PENDING_APPROVAL", "REJECTED"]);

export async function GET(_req: Request, { params }: Params) {
  const { error } = await requirePermission("quotes.manage");
  if (error) return error;
  const { id } = await params;
  const quote = await db.quotation.findUnique({
    where: { id },
    include: { lead: { select: { id: true, name: true } } },
  });
  if (!quote) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true, quote });
}

export async function PATCH(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("quotes.manage");
  if (error) return error;
  const { id } = await params;

  const existing = await db.quotation.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  if (!EDITABLE.has(existing.status)) {
    return NextResponse.json(
      { ok: false, error: "This quotation is locked. Create a revision to change it." },
      { status: 409 },
    );
  }

  const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const data: Prisma.QuotationUpdateInput = {};
  const assign = <K extends keyof typeof d>(k: K, col?: string) => {
    if (d[k] !== undefined) (data as Record<string, unknown>)[(col ?? k) as string] = d[k];
  };
  (["clientName", "clientCompany", "clientEmail", "clientPhone", "clientAddress",
    "clientGstin", "title", "notes", "currency", "items", "discountPct",
    "taxRatePct", "taxMode"] as const).forEach((k) => assign(k));
  if (d.leadId !== undefined) data.lead = d.leadId ? { connect: { id: d.leadId } } : { disconnect: true };
  if (d.validUntil !== undefined) data.validUntil = d.validUntil ? new Date(d.validUntil) : null;

  // Recompute stored totals from the effective (merged) pricing inputs.
  const effective = {
    items: (d.items ?? (existing.items as unknown as QuoteItem[])) as QuoteItem[],
    discountPct: d.discountPct ?? existing.discountPct,
    taxRatePct: d.taxRatePct ?? existing.taxRatePct,
    taxMode: d.taxMode ?? existing.taxMode,
  };
  Object.assign(data, totalsFor(effective));

  const quote = await db.quotation.update({ where: { id }, data });
  audit({ userId: user.id, action: "quotation.update", entity: "quotation", entityId: id, meta: { fields: Object.keys(d) }, ip: clientIp(req) });
  return NextResponse.json({ ok: true, quote });
}

export async function DELETE(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("quotes.manage");
  if (error) return error;
  const { id } = await params;
  const existing = await db.quotation.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  if (existing.status === "ACCEPTED") {
    return NextResponse.json({ ok: false, error: "Accepted quotations can't be deleted." }, { status: 409 });
  }
  await db.quotation.delete({ where: { id } });
  audit({ userId: user.id, action: "quotation.delete", entity: "quotation", entityId: id, meta: { number: existing.number }, ip: clientIp(req) });
  return NextResponse.json({ ok: true });
}
