/* Client-safe helpers for the payments ledger — labels, badge styles and
   money formatting shared by the admin list, the editor form and the API.
   No server imports (lib/payments.ts holds the gateway *config* and is
   server-only because it reads credentials). */

export const PAYMENT_STATUSES = [
  "PENDING",
  "PARTIAL",
  "PAID",
  "REFUNDED",
  "FAILED",
  "CANCELLED",
] as const;
export type PaymentStatusKey = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatusKey, string> = {
  PENDING: "Pending",
  PARTIAL: "Part paid",
  PAID: "Paid",
  REFUNDED: "Refunded",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export const PAYMENT_STATUS_STYLE: Record<PaymentStatusKey, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  PARTIAL: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  PAID: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  REFUNDED: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  CANCELLED: "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
};

/** Statuses that represent money actually received — what "collected" sums. */
export const SETTLED_STATUSES: readonly PaymentStatusKey[] = ["PAID", "PARTIAL"];

export const PAYMENT_METHODS = [
  { id: "upi", label: "UPI" },
  { id: "bank", label: "Bank transfer" },
  { id: "wire", label: "Wire / SWIFT" },
  { id: "cashfree", label: "Cashfree" },
  { id: "paypal", label: "PayPal" },
  { id: "cheque", label: "Cheque" },
  { id: "cash", label: "Cash" },
  { id: "other", label: "Other" },
] as const;
export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export const METHOD_LABEL: Record<string, string> = Object.fromEntries(
  PAYMENT_METHODS.map((m) => [m.id, m.label]),
);

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD"] as const;

const CURRENCY_LOCALE: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  AED: "en-AE",
  SGD: "en-SG",
  AUD: "en-AU",
};

/** Locale-aware money. Indian grouping matters here — ₹12,34,567 not
    ₹1,234,567 — so the locale follows the currency rather than the browser. */
export function formatMoney(amount: number, currency = "INR"): string {
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? "en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** Which statuses a row may move to. Terminal states stay put so the ledger
    cannot be quietly rewritten after the fact. */
export const STATUS_TRANSITIONS: Record<PaymentStatusKey, readonly PaymentStatusKey[]> = {
  PENDING: ["PARTIAL", "PAID", "FAILED", "CANCELLED"],
  PARTIAL: ["PAID", "REFUNDED", "FAILED", "CANCELLED"],
  PAID: ["REFUNDED"],
  REFUNDED: [],
  FAILED: ["PENDING"],
  CANCELLED: ["PENDING"],
};

export function canTransition(from: PaymentStatusKey, to: PaymentStatusKey): boolean {
  return from === to || STATUS_TRANSITIONS[from].includes(to);
}

/** PAY-<year>-<4-digit sequence>. */
export function paymentReference(year: number, seq: number): string {
  return `PAY-${year}-${String(seq).padStart(4, "0")}`;
}
