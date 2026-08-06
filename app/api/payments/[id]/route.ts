import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  CURRENCIES,
  canTransition,
  type PaymentStatusKey,
} from "@/lib/payment-records";

type Params = { params: Promise<{ id: string }> };

const METHOD_IDS = PAYMENT_METHODS.map((m) => m.id) as [string, ...string[]];

const UpdateSchema = z
  .object({
    clientName: z.string().trim().min(2).max(160).optional(),
    clientCompany: z.string().trim().max(160).nullable().optional(),
    clientEmail: z.string().trim().email().max(200).nullable().optional().or(z.literal("")),
    clientPhone: z.string().trim().max(40).nullable().optional(),
    amount: z.number().positive().max(1_000_000_000).optional(),
    currency: z.enum(CURRENCIES).optional(),
    method: z.enum(METHOD_IDS).optional(),
    status: z.enum(PAYMENT_STATUSES).optional(),
    txnRef: z.string().trim().max(120).nullable().optional(),
    paidAt: z.string().datetime().nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    leadId: z.string().trim().max(40).nullable().optional(),
    quotationId: z.string().trim().max(40).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Nothing to update." });

export async function PATCH(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("payments.manage");
  if (error) return error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const existing = await db.payment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Payment not found." }, { status: 404 });
  }

  /* A settled row must not be silently rewritten — refunds move forward, they
     do not edit history back to PENDING. */
  const d = parsed.data;
  if (d.status && !canTransition(existing.status as PaymentStatusKey, d.status)) {
    return NextResponse.json(
      {
        ok: false,
        error: `A ${existing.status.toLowerCase()} payment cannot become ${d.status.toLowerCase()}.`,
      },
      { status: 409 },
    );
  }

  /* Marking a payment settled without a date is the common slip — stamp it
     rather than leaving a paid row with no idea when the money landed. */
  const settling = d.status === "PAID" || d.status === "PARTIAL";
  const paidAt =
    d.paidAt !== undefined
      ? d.paidAt
        ? new Date(d.paidAt)
        : null
      : settling && !existing.paidAt
        ? new Date()
        : undefined;

  const payment = await db.payment.update({
    where: { id },
    data: {
      ...(d.clientName !== undefined ? { clientName: d.clientName } : {}),
      ...(d.clientCompany !== undefined ? { clientCompany: d.clientCompany || null } : {}),
      ...(d.clientEmail !== undefined ? { clientEmail: d.clientEmail || null } : {}),
      ...(d.clientPhone !== undefined ? { clientPhone: d.clientPhone || null } : {}),
      ...(d.amount !== undefined ? { amount: d.amount } : {}),
      ...(d.currency !== undefined ? { currency: d.currency } : {}),
      ...(d.method !== undefined ? { method: d.method } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(d.txnRef !== undefined ? { txnRef: d.txnRef || null } : {}),
      ...(d.notes !== undefined ? { notes: d.notes || null } : {}),
      ...(d.leadId !== undefined ? { leadId: d.leadId || null } : {}),
      ...(d.quotationId !== undefined ? { quotationId: d.quotationId || null } : {}),
      ...(paidAt !== undefined ? { paidAt } : {}),
    },
  });

  audit({
    userId: user.id,
    action: "payment.update",
    entity: "payment",
    entityId: id,
    meta: { reference: payment.reference, fields: Object.keys(d) },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, payment });
}

export async function DELETE(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("payments.manage");
  if (error) return error;
  const { id } = await params;

  const existing = await db.payment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Payment not found." }, { status: 404 });
  }
  /* Settled money is an accounting record. Cancel or refund it instead — that
     keeps the trail, where deleting would quietly change the books. */
  if (existing.status === "PAID" || existing.status === "PARTIAL" || existing.status === "REFUNDED") {
    return NextResponse.json(
      { ok: false, error: "A settled payment cannot be deleted — refund or cancel it instead." },
      { status: 409 },
    );
  }

  await db.payment.delete({ where: { id } });
  audit({
    userId: user.id,
    action: "payment.delete",
    entity: "payment",
    entityId: id,
    meta: { reference: existing.reference },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
