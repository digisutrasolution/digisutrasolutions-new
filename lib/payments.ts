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

/* Every field below this line is `.default("")`.
   That is not tidiness — getPayments() safeParses the stored SiteSetting and
   falls back to DEFAULT_PAYMENTS on ANY failure, so one required new field
   would make the existing row fail to parse and silently wipe the UPI ID and
   bank details already saved in production. Defaults keep old rows valid. */
const line = (max = 120) => z.string().trim().max(max).default("");

export const SimpleMethodSchema = z.object({
  enabled: z.boolean(),
  /** Free text, kept so anything typed before the structured fields survives. */
  note: z.string().trim().max(300).default(""),
});

/** UPI is the only manual method shown publicly. */
export const UpiMethodSchema = SimpleMethodSchema.extend({
  upiId: line(80),
  /** Optional override; blank means "generate the QR from upiId". */
  qrUrl: line(400),
  /** Payee name encoded in the QR, so a scanner shows who is being paid. */
  payeeName: line(80),
});

/* Opt-in publishing for the two methods that carry real account details.
   Defaulted false so deploying changes nothing until it is ticked, and so an
   existing stored row still parses (getPayments falls back to DEFAULT_PAYMENTS
   on any parse failure — a required field here would wipe live settings). */
const showOnSite = z.boolean().default(false);

/** Indian bank transfer — private unless showOnSite is ticked. */
export const BankMethodSchema = SimpleMethodSchema.extend({
  showOnSite,
  accountName: line(120),
  accountNumber: line(40),
  ifsc: line(20),
  bankName: line(120),
  branch: line(120),
  accountType: line(40),
});

/** International wire — private unless showOnSite is ticked. */
export const WireMethodSchema = SimpleMethodSchema.extend({
  showOnSite,
  beneficiary: line(120),
  accountNumber: line(40),
  swift: line(20),
  bankName: line(120),
  bankAddress: line(200),
});

export const PaymentsSchema = z.object({
  cashfree: GatewaySchema,
  paypal: GatewaySchema,
  upi: UpiMethodSchema,
  bank: BankMethodSchema,
  wire: WireMethodSchema,
});

export type Gateway = z.infer<typeof GatewaySchema>;
export type Payments = z.infer<typeof PaymentsSchema>;

export const DEFAULT_PAYMENTS: Payments = {
  cashfree: { enabled: true, mode: "test", keyId: "", keySecret: "" },
  paypal: { enabled: true, mode: "test", keyId: "", keySecret: "" },
  upi: { enabled: true, note: "", upiId: "", qrUrl: "", payeeName: "" },
  bank: {
    enabled: true, showOnSite: false, note: "", accountName: "", accountNumber: "",
    ifsc: "", bankName: "", branch: "", accountType: "",
  },
  wire: {
    enabled: true, showOnSite: false, note: "", beneficiary: "", accountNumber: "",
    swift: "", bankName: "", bankAddress: "",
  },
};

export type PaymentMethodKey = keyof Payments;

/**
 * What the public page may know.
 *
 * This is still the single decision point about what the public site may see —
 * gateway secrets never appear here at all, and bank/wire account details
 * appear ONLY when that method's `showOnSite` is ticked.
 *
 * They are optional on the type rather than always present, so a page that
 * forgets to check gets `undefined` instead of a number it should not print.
 * The default is off: a published account number and IFSC get scraped, and
 * they let someone quote real-looking details on a fake invoice. When it is
 * off the details still reach the client on the quotation (see quote-print).
 */
export type PublicPayments = {
  cashfree: { enabled: boolean };
  paypal: { enabled: boolean };
  upi: {
    enabled: boolean;
    note: string;
    upiId: string;
    /** Already-resolved image URL, or "" to generate from upiId. */
    qrUrl: string;
    payeeName: string;
  };
  bank: {
    enabled: boolean;
    note: string;
    accountName?: string;
    accountNumber?: string;
    ifsc?: string;
    bankName?: string;
    branch?: string;
    accountType?: string;
  };
  wire: {
    enabled: boolean;
    note: string;
    beneficiary?: string;
    accountNumber?: string;
    swift?: string;
    bankName?: string;
    bankAddress?: string;
  };
};

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
    upi: {
      enabled: p.upi.enabled,
      note: p.upi.note,
      upiId: p.upi.upiId,
      qrUrl: p.upi.qrUrl,
      payeeName: p.upi.payeeName,
    },
    /* Fields are picked one by one rather than spread. A spread would quietly
       start publishing any field added to the schema later — which for these
       two means an account number on a public page. */
    bank: {
      enabled: p.bank.enabled,
      note: p.bank.note,
      ...(p.bank.showOnSite
        ? {
            accountName: p.bank.accountName,
            accountNumber: p.bank.accountNumber,
            ifsc: p.bank.ifsc,
            bankName: p.bank.bankName,
            branch: p.bank.branch,
            accountType: p.bank.accountType,
          }
        : {}),
    },
    wire: {
      enabled: p.wire.enabled,
      note: p.wire.note,
      ...(p.wire.showOnSite
        ? {
            beneficiary: p.wire.beneficiary,
            accountNumber: p.wire.accountNumber,
            swift: p.wire.swift,
            bankName: p.wire.bankName,
            bankAddress: p.wire.bankAddress,
          }
        : {}),
    },
  };
}

/** Label/value pairs to print, skipping blanks. Shared by the public page and
    the quotation so the two never show a different set of fields. */
export function detailRows(
  pairs: [string, string | undefined][],
): { label: string; value: string }[] {
  return pairs
    .filter(([, v]) => (v ?? "").trim().length > 0)
    .map(([label, v]) => ({ label, value: (v ?? "").trim() }));
}

/**
 * The UPI deep link a QR encodes. Empty when there is no UPI ID, so callers
 * can treat "" as "nothing to show" rather than rendering a QR that resolves
 * to a broken payment.
 */
export function upiPayUrl(upiId: string, payeeName: string): string {
  const id = upiId.trim();
  if (!id) return "";
  const params = new URLSearchParams({ pa: id });
  if (payeeName.trim()) params.set("pn", payeeName.trim());
  // upi:// takes its params after a bare "?" with no host or path.
  return `upi://pay?${params.toString()}`;
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
