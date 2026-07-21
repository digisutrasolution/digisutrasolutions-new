import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { PaymentsSchema, getPayments, maskPayments } from "@/lib/payments";
import { clientIp } from "@/lib/rate-limit";

/* Secrets are write-only: the client may send a new one, but an empty
   string means "keep what is stored" and GET never returns them. */
const IncomingGateway = z.object({
  enabled: z.boolean(),
  mode: z.enum(["test", "live"]),
  keyId: z.string().trim().max(200),
  keySecret: z.string().trim().max(400).optional(),
});
const IncomingSimple = z.object({
  enabled: z.boolean(),
  note: z.string().trim().max(160),
});
const IncomingSchema = z.object({
  cashfree: IncomingGateway,
  paypal: IncomingGateway,
  upi: IncomingSimple,
  bank: IncomingSimple,
  wire: IncomingSimple,
});

export async function GET() {
  const { error } = await requirePermission("settings.manage");
  if (error) return error;
  return NextResponse.json({ ok: true, payments: maskPayments(await getPayments()) });
}

export async function PUT(req: Request) {
  const { user, error } = await requirePermission("settings.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = IncomingSchema.safeParse(body?.payments);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid payment settings." },
      { status: 400 },
    );
  }

  const current = await getPayments();
  const d = parsed.data;
  const merged = PaymentsSchema.parse({
    cashfree: {
      ...d.cashfree,
      keySecret: d.cashfree.keySecret || current.cashfree.keySecret,
    },
    paypal: {
      ...d.paypal,
      keySecret: d.paypal.keySecret || current.paypal.keySecret,
    },
    upi: d.upi,
    bank: d.bank,
    wire: d.wire,
  });

  await db.siteSetting.upsert({
    where: { key: "payments" },
    create: { key: "payments", value: merged },
    update: { value: merged },
  });

  audit({
    userId: user.id,
    action: "settings.payments.update",
    entity: "siteSetting",
    entityId: "payments",
    // Never log credentials — only what changed at a glance.
    meta: {
      cashfree: `${merged.cashfree.enabled ? "on" : "off"}/${merged.cashfree.mode}`,
      paypal: `${merged.paypal.enabled ? "on" : "off"}/${merged.paypal.mode}`,
      upi: merged.upi.enabled,
      bank: merged.bank.enabled,
      wire: merged.wire.enabled,
    },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, payments: maskPayments(merged) });
}
