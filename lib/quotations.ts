/* Quotations — client-safe core (no db/server imports). Status vocabulary,
   the money math (line discounts, overall discount, GST), and formatting,
   shared by the builder, the list, the read view and the print/PDF page. */

export const QUOTATION_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "SUPERSEDED",
  "EXPIRED",
] as const;
export type QuotationStatusKey = (typeof QUOTATION_STATUSES)[number];

export const QUOTE_STATUS_LABEL: Record<QuotationStatusKey, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending approval",
  APPROVED: "Approved",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  SUPERSEDED: "Superseded",
  EXPIRED: "Expired",
};

export const QUOTE_STATUS_STYLE: Record<QuotationStatusKey, string> = {
  DRAFT: "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
  PENDING_APPROVAL: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  APPROVED: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  SENT: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  ACCEPTED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  SUPERSEDED: "bg-stone-200 text-stone-500 dark:bg-stone-800 dark:text-stone-400",
  EXPIRED: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
};

export const quoteStatusLabel = (s: string) =>
  QUOTE_STATUS_LABEL[s as QuotationStatusKey] ?? s;

export const TAX_MODES = ["CGST_SGST", "IGST", "NONE"] as const;
export type TaxModeKey = (typeof TAX_MODES)[number];
export const TAX_MODE_LABEL: Record<TaxModeKey, string> = {
  CGST_SGST: "CGST + SGST (intra-state)",
  IGST: "IGST (inter-state)",
  NONE: "No tax",
};

export type QuoteItem = {
  description: string;
  qty: number;
  unitPrice: number;
  /** Per-line discount %, 0–100. */
  discountPct: number;
};

export type QuoteTotals = {
  subtotal: number; // sum of line nets (after line discounts)
  discountAmount: number; // overall discount amount
  taxable: number; // subtotal - overall discount
  taxAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
};

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function lineNet(item: QuoteItem): number {
  const gross = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0);
  const disc = gross * (clampPct(item.discountPct) / 100);
  return round2(gross - disc);
}

function clampPct(v: number): number {
  const n = Number(v) || 0;
  return Math.min(100, Math.max(0, n));
}

export function computeTotals(
  items: QuoteItem[],
  discountPct: number,
  taxRatePct: number,
  taxMode: string,
): QuoteTotals {
  const subtotal = round2(items.reduce((sum, it) => sum + lineNet(it), 0));
  const discountAmount = round2(subtotal * (clampPct(discountPct) / 100));
  const taxable = round2(subtotal - discountAmount);
  const rate = taxMode === "NONE" ? 0 : Math.max(0, Number(taxRatePct) || 0);
  const taxAmount = round2(taxable * (rate / 100));
  const cgst = taxMode === "CGST_SGST" ? round2(taxAmount / 2) : 0;
  const sgst = taxMode === "CGST_SGST" ? round2(taxAmount - cgst) : 0;
  const igst = taxMode === "IGST" ? taxAmount : 0;
  const total = round2(taxable + taxAmount);
  return { subtotal, discountAmount, taxable, taxAmount, cgst, sgst, igst, total };
}

const CURRENCY_SYMBOL: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "AED " };

export function formatMoney(amount: number, currency = "INR"): string {
  const sym = CURRENCY_SYMBOL[currency] ?? "";
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return `${sym}${(Number(amount) || 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Display id like "QUO-2026-0007 · v2" (version only shown past the first). */
export function quoteRef(number: string, version: number): string {
  return version > 1 ? `${number} · v${version}` : number;
}
