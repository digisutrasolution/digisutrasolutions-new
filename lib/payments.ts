import { z } from "zod";
import { db } from "@/lib/db";

/* Payment method configuration (SiteSetting "payments").

   Gateways carry credentials, so this module is server-only: the public
   site imports getPublicPayments(), which returns just what is safe to
   render, and the admin API masks secrets on the way out. Checkout is not
   wired yet — these settings control which methods /payment advertises
   and hold the keys for when it is. */

export const GatewaySchema = z.object({
  enabled: z.boolean(),
  mode: z.enum(["test", "live"]),
  keyId: z.string().trim().max(200),
  keySecret: z.string().trim().max(400),
});

export const SimpleMethodSchema = z.object({
  enabled: z.boolean(),
  note: z.string().trim().max(160),
});

export const PaymentsSchema = z.object({
  cashfree: GatewaySchema,
  paypal: GatewaySchema,
  upi: SimpleMethodSchema,
  bank: SimpleMethodSchema,
  wire: SimpleMethodSchema,
});

export type Gateway = z.infer<typeof GatewaySchema>;
export type Payments = z.infer<typeof PaymentsSchema>;

export const DEFAULT_PAYMENTS: Payments = {
  cashfree: { enabled: true, mode: "test", keyId: "", keySecret: "" },
  paypal: { enabled: true, mode: "test", keyId: "", keySecret: "" },
  upi: { enabled: true, note: "" },
  bank: { enabled: true, note: "" },
  wire: { enabled: true, note: "" },
};

export type PaymentMethodKey = keyof Payments;

/** What the public page may know — never credentials. */
export type PublicPayments = Record<PaymentMethodKey, { enabled: boolean; note?: string }>;

export async function getPayments(): Promise<Payments> {
  try {
    const row = await db.siteSetting.findUnique({ where: { key: "payments" } });
    const parsed = PaymentsSchema.safeParse(row?.value);
    if (parsed.success) return parsed.data;
  } catch {
    /* DB down → defaults keep /payment rendering */
  }
  return DEFAULT_PAYMENTS;
}

export async function getPublicPayments(): Promise<PublicPayments> {
  const p = await getPayments();
  return {
    cashfree: { enabled: p.cashfree.enabled },
    paypal: { enabled: p.paypal.enabled },
    upi: { enabled: p.upi.enabled, note: p.upi.note },
    bank: { enabled: p.bank.enabled, note: p.bank.note },
    wire: { enabled: p.wire.enabled, note: p.wire.note },
  };
}

/** Admin view: secrets replaced by a "configured" flag. */
export function maskPayments(p: Payments) {
  const mask = (g: Gateway) => ({
    enabled: g.enabled,
    mode: g.mode,
    keyId: g.keyId,
    hasSecret: g.keySecret.length > 0,
  });
  return {
    cashfree: mask(p.cashfree),
    paypal: mask(p.paypal),
    upi: p.upi,
    bank: p.bank,
    wire: p.wire,
  };
}

/** True when a gateway is switched on but cannot actually transact yet. */
export function gatewayIncomplete(g: Gateway): boolean {
  return g.enabled && (!g.keyId || !g.keySecret);
}
