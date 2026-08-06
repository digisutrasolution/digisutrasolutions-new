import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  CURRENCIES,
  paymentReference,
  SETTLED_STATUSES,
} from "@/lib/payment-records";

const METHOD_IDS = PAYMENT_METHODS.map((m) => m.id) as [string, ...string[]];

const CreateSchema = z.object({
  leadId: z.string().trim().min(1).max(40).nullable().optional(),
  quotationId: z.string().trim().min(1).max(40).nullable().optional(),
  clientName: z.string().trim().min(2).max(160),
  clientCompany: z.string().trim().max(160).nullable().optional(),
  clientEmail: z.string().trim().email().max(200).nullable().optional().or(z.literal("")),
  clientPhone: z.string().trim().max(40).nullable().optional(),
  amount: z.number().positive().max(1_000_000_000),
  currency: z.enum(CURRENCIES).default("INR"),
  method: z.enum(METHOD_IDS).default("bank"),
  status: z.enum(PAYMENT_STATUSES).default("PENDING"),
  txnRef: z.string().trim().max(120).nullable().optional(),
  paidAt: z.string().datetime().nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

/** Next reference in the current year. Sequence is per-year and gap-tolerant:
    a deleted row does not renumber the ones after it. */
async function nextReference(): Promise<string> {
  const year = new Date().getFullYear();
  const last = await db.payment.findFirst({
    where: { reference: { startsWith: `PAY-${year}-` } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const seq = last ? Number.parseInt(last.reference.split("-")[2] ?? "0", 10) + 1 : 1;
  return paymentReference(year, Number.isFinite(seq) ? seq : 1);
}

/** List payments with filters, a totals summary and pagination. */
export async function GET(req: Request) {
  const { error } = await requirePermission("payments.manage");
  if (error) return error;

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const status = url.searchParams.get("status") ?? "";
  const method = url.searchParams.get("method") ?? "";
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(10, Number.parseInt(url.searchParams.get("pageSize") ?? "25", 10) || 25),
  );

  const where: Prisma.PaymentWhereInput = {};
  if (status && (PAYMENT_STATUSES as readonly string[]).includes(status)) {
    where.status = status as (typeof PAYMENT_STATUSES)[number];
  }
  if (method && METHOD_IDS.includes(method)) where.method = method;
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { clientName: { contains: q, mode: "insensitive" } },
      { clientCompany: { contains: q, mode: "insensitive" } },
      { clientEmail: { contains: q, mode: "insensitive" } },
      { txnRef: { contains: q, mode: "insensitive" } },
    ];
  }
  /* Date filters read on createdAt so a row always falls in a window even
     before it is marked paid (paidAt is null while pending). */
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
    };
  }

  const [rows, total, grandTotal, sums] = await Promise.all([
    db.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        lead: { select: { id: true, name: true } },
        quotation: { select: { id: true, number: true, version: true } },
      },
    }),
    db.payment.count({ where }),
    db.payment.count(),
    db.payment.groupBy({ by: ["status", "currency"], where, _sum: { amount: true } }),
  ]);

  /* Totals are grouped by currency — summing mixed currencies into one number
     would be meaningless, so the UI shows a line per currency. */
  const totals: Record<string, { collected: number; pending: number }> = {};
  for (const g of sums) {
    const bucket = (totals[g.currency] ??= { collected: 0, pending: 0 });
    const amount = g._sum.amount ?? 0;
    if ((SETTLED_STATUSES as readonly string[]).includes(g.status)) bucket.collected += amount;
    else if (g.status === "PENDING") bucket.pending += amount;
  }

  return NextResponse.json({ ok: true, payments: rows, total, grandTotal, page, pageSize, totals });
}

/** Record a payment. */
export async function POST(req: Request) {
  const { user, error } = await requirePermission("payments.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  /* Recording a payment that is already settled should carry a date — without
     this, a row entered straight as PAID has no idea when the money landed.
     Mirrors the same stamp on PATCH. */
  const settling = d.status === "PAID" || d.status === "PARTIAL";
  const paidAt = d.paidAt ? new Date(d.paidAt) : settling ? new Date() : null;

  const payment = await db.payment.create({
    data: {
      reference: await nextReference(),
      leadId: d.leadId || null,
      quotationId: d.quotationId || null,
      clientName: d.clientName,
      clientCompany: d.clientCompany || null,
      clientEmail: d.clientEmail || null,
      clientPhone: d.clientPhone || null,
      amount: d.amount,
      currency: d.currency,
      method: d.method,
      status: d.status,
      txnRef: d.txnRef || null,
      paidAt,
      notes: d.notes || null,
      recordedById: user.id,
      recordedByName: user.name,
    },
  });

  audit({
    userId: user.id,
    action: "payment.create",
    entity: "payment",
    entityId: payment.id,
    meta: { reference: payment.reference, amount: payment.amount, currency: payment.currency },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, payment }, { status: 201 });
}
