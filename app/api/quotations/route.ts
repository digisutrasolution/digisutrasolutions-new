import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { nextQuotationNumber } from "@/lib/quotations-server";
import { computeTotals, QUOTATION_STATUSES, TAX_MODES, type QuoteItem } from "@/lib/quotations";

const ItemSchema = z.object({
  description: z.string().trim().max(500).default(""),
  qty: z.number().min(0).max(1_000_000).default(1),
  unitPrice: z.number().min(0).max(1_000_000_000).default(0),
  discountPct: z.number().min(0).max(100).default(0),
});

export const QuoteInputSchema = z.object({
  leadId: z.string().nullable().optional(),
  clientName: z.string().trim().min(1).max(160),
  clientCompany: z.string().trim().max(160).nullable().optional(),
  clientEmail: z.string().trim().max(200).nullable().optional(),
  clientPhone: z.string().trim().max(40).nullable().optional(),
  clientAddress: z.string().trim().max(600).nullable().optional(),
  clientGstin: z.string().trim().max(20).nullable().optional(),
  title: z.string().trim().max(200).default(""),
  notes: z.string().trim().max(4000).default(""),
  currency: z.string().trim().max(4).default("INR"),
  items: z.array(ItemSchema).max(60).default([]),
  discountPct: z.number().min(0).max(100).default(0),
  taxRatePct: z.number().min(0).max(100).default(18),
  taxMode: z.enum(TAX_MODES).default("CGST_SGST"),
  validUntil: z.string().datetime().nullable().optional(),
});

/** Persisted money totals for a set of inputs. */
export function totalsFor(input: {
  items: QuoteItem[];
  discountPct: number;
  taxRatePct: number;
  taxMode: string;
}) {
  const t = computeTotals(input.items, input.discountPct, input.taxRatePct, input.taxMode);
  return { subtotal: t.subtotal, discountAmount: t.discountAmount, taxAmount: t.taxAmount, total: t.total };
}

/** List quotations (filter by status / lead / text). */
export async function GET(req: Request) {
  const { error } = await requirePermission("quotes.manage");
  if (error) return error;

  const p = new URL(req.url).searchParams;
  const where: Prisma.QuotationWhereInput = {};
  const status = p.get("status");
  if (status && status !== "ALL" && (QUOTATION_STATUSES as readonly string[]).includes(status)) {
    where.status = status as (typeof QUOTATION_STATUSES)[number];
  }
  const leadId = p.get("leadId");
  if (leadId) where.leadId = leadId;
  const q = p.get("q")?.trim();
  if (q) {
    where.OR = [
      { number: { contains: q, mode: "insensitive" } },
      { clientName: { contains: q, mode: "insensitive" } },
      { clientCompany: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
    ];
  }

  const quotations = await db.quotation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 300,
    select: {
      id: true, number: true, version: true, clientName: true, clientCompany: true,
      title: true, total: true, currency: true, status: true, validUntil: true,
      leadId: true, createdByName: true, createdAt: true,
    },
  });
  return NextResponse.json({ ok: true, quotations });
}

export async function POST(req: Request) {
  const { user, error } = await requirePermission("quotes.manage");
  if (error) return error;

  const parsed = QuoteInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const number = await nextQuotationNumber(new Date().getFullYear());
  const quote = await db.quotation.create({
    data: {
      number,
      version: 1,
      leadId: d.leadId ?? null,
      clientName: d.clientName,
      clientCompany: d.clientCompany ?? null,
      clientEmail: d.clientEmail ?? null,
      clientPhone: d.clientPhone ?? null,
      clientAddress: d.clientAddress ?? null,
      clientGstin: d.clientGstin ?? null,
      title: d.title,
      notes: d.notes,
      currency: d.currency,
      items: d.items,
      discountPct: d.discountPct,
      taxRatePct: d.taxRatePct,
      taxMode: d.taxMode,
      validUntil: d.validUntil ? new Date(d.validUntil) : null,
      ...totalsFor(d),
      createdById: user.id,
      createdByName: user.name,
    },
  });

  audit({ userId: user.id, action: "quotation.create", entity: "quotation", entityId: quote.id, meta: { number }, ip: clientIp(req) });
  return NextResponse.json({ ok: true, id: quote.id, number }, { status: 201 });
}
