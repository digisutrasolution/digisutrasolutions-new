/* ROI projection model for the public calculator.

   Deliberately conservative and transparent: every output is a RANGE
   derived from published house figures, never a single confident number,
   and the assumptions travel with the result. Marketing outcomes depend
   on offer, market and execution — this estimates, it does not promise. */

/** Blended return range across DigiSutra clients. The top of the range is
    the site-wide "5.8× average ROAS" figure; the floor is the conservative
    case we plan campaigns against. */
export const ROAS_LOW = 3.2;
export const ROAS_HIGH = 5.8;

/** Typical share of a monthly budget that reaches ad platforms once
    management is paid (the rest funds strategy, creative and reporting). */
export const MEDIA_SHARE = 0.7;

/** Months before the modelled range is typically reached. */
export const RAMP_MONTHS = "3–6 months";

export type RoiInputs = {
  /** Total monthly marketing budget in ₹ (management + ad spend). */
  budget: number;
  /** Average order or deal value in ₹. */
  orderValue: number;
  /** Share of enquiries that become customers, 0–1. */
  closeRate: number;
};

export type RoiResult = {
  mediaSpend: number;
  revenueLow: number;
  revenueHigh: number;
  ordersLow: number;
  ordersHigh: number;
  leadsLow: number;
  leadsHigh: number;
  netLow: number;
  netHigh: number;
  roasLow: number;
  roasHigh: number;
};

export type Currency = "INR" | "USD";

/* Ranges are per currency, not a live FX conversion: the slider stops should
   be sensible round numbers a buyer recognises, so $1,000 rather than the
   arithmetic ₹50,000 ÷ 83. The maths downstream is a pure ratio, so it is
   identical in either currency — only these bounds and the formatting differ. */
export const ROI_DEFAULTS_BY_CURRENCY: Record<Currency, RoiInputs> = {
  INR: { budget: 50000, orderValue: 8000, closeRate: 0.25 },
  USD: { budget: 1500, orderValue: 120, closeRate: 0.25 },
};

export const ROI_LIMITS_BY_CURRENCY: Record<
  Currency,
  {
    budget: { min: number; max: number; step: number };
    orderValue: { min: number; max: number; step: number };
    closeRate: { min: number; max: number; step: number };
  }
> = {
  INR: {
    budget: { min: 15000, max: 500000, step: 5000 },
    orderValue: { min: 1000, max: 500000, step: 1000 },
    closeRate: { min: 0.05, max: 0.6, step: 0.05 },
  },
  USD: {
    budget: { min: 200, max: 10000, step: 100 },
    orderValue: { min: 20, max: 10000, step: 20 },
    closeRate: { min: 0.05, max: 0.6, step: 0.05 },
  },
};

/* Kept so nothing that imported the old names breaks; they are the INR set. */
export const ROI_DEFAULTS: RoiInputs = ROI_DEFAULTS_BY_CURRENCY.INR;
export const ROI_LIMITS = ROI_LIMITS_BY_CURRENCY.INR;

export function calculateRoi(input: RoiInputs, currency: Currency = "INR"): RoiResult {
  const limits = ROI_LIMITS_BY_CURRENCY[currency];
  const budget = clamp(input.budget, limits.budget.min, limits.budget.max);
  const orderValue = Math.max(limits.orderValue.min, input.orderValue);
  const closeRate = clamp(input.closeRate, limits.closeRate.min, limits.closeRate.max);

  const mediaSpend = Math.round(budget * MEDIA_SHARE);
  const revenueLow = Math.round(mediaSpend * ROAS_LOW);
  const revenueHigh = Math.round(mediaSpend * ROAS_HIGH);
  const ordersLow = Math.max(1, Math.round(revenueLow / orderValue));
  const ordersHigh = Math.max(1, Math.round(revenueHigh / orderValue));

  return {
    mediaSpend,
    revenueLow,
    revenueHigh,
    ordersLow,
    ordersHigh,
    leadsLow: Math.max(1, Math.round(ordersLow / closeRate)),
    leadsHigh: Math.max(1, Math.round(ordersHigh / closeRate)),
    netLow: revenueLow - budget,
    netHigh: revenueHigh - budget,
    // Return on the full budget, not just media — the number a founder cares about.
    roasLow: round1(revenueLow / budget),
    roasHigh: round1(revenueHigh / budget),
  };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

/** ₹ in Indian short form: 45,000 · 2.4L · 1.3Cr. */
export function inrShort(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 10000000) return `₹${round1(value / 10000000)}Cr`;
  if (abs >= 100000) return `₹${round1(value / 100000)}L`;
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

/** $ in Western short form: $1,500 · $45K · $1.3M. */
export function usdShort(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1000000) return `$${round1(value / 1000000)}M`;
  if (abs >= 10000) return `$${round1(value / 1000)}K`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

/** Formats a figure in the visitor's currency. */
export function moneyShort(value: number, currency: Currency): string {
  return currency === "USD" ? usdShort(value) : inrShort(value);
}

export const ROI_ASSUMPTIONS = [
  `Modelled on a ${ROAS_LOW}×–${ROAS_HIGH}× return on ad spend — our client range, reached over ${RAMP_MONTHS}.`,
  `Assumes about ${Math.round(MEDIA_SHARE * 100)}% of the budget reaches ad platforms; the rest covers strategy, creative and reporting.`,
  "Excludes GST, platform fees and your cost of goods.",
];
