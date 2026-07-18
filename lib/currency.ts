/* Client-safe INR→USD display conversion for the pricing surfaces.
   USD figures are approximate marketing prices — invoices state the
   exact amount. Update USD_RATE when the rupee moves materially. */

export const USD_RATE = 87; // ₹ per US$

function prettyUsd(v: number): string {
  let r: number;
  if (v >= 1000) r = Math.round(v / 50) * 50;
  else if (v >= 100) r = Math.round(v / 5) * 5;
  else r = Math.max(5, Math.round(v / 5) * 5);
  return r.toLocaleString("en-US");
}

/** Replaces every ₹-amount in a price string with its rounded $ figure
    ("from ₹15,000/mo" → "from $170/mo"); strings without ₹ pass through. */
export function inrToUsdDisplay(s: string, rate: number = USD_RATE): string {
  return s.replace(/₹\s?([\d,]+)/g, (match, digits: string) => {
    const n = Number(digits.replace(/,/g, ""));
    if (!Number.isFinite(n) || n <= 0) return match;
    return "$" + prettyUsd(n / rate);
  });
}
