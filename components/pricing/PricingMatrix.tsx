"use client";

import { useState } from "react";
import Link from "next/link";
import { ChartLine, FileSearch, Info, PauseCircle } from "lucide-react";
import { inrToUsdDisplay, USD_RATE } from "@/lib/currency";
import type { Currency } from "@/lib/geo";
import type { MatrixRowDef, PlanDef, RateRowDef } from "@/lib/pricing";

/* Billing + currency toggles, plan header cards, feature comparison matrix,
   risk-reversal strip and the one-off rate card. The recommended plan's
   column is lifted with an orange frame end to end.

   USD uses the owner-entered price when there is one and falls back to the
   rate conversion in lib/currency.ts otherwise. Market notes are hidden in
   USD rather than converted: they benchmark the Indian market, so they mean
   little to an overseas buyer, and they are written in k/L shorthand
   ("₹20k–₹50k", "₹4L") that the converter's digit regex would mangle into
   nonsense like "$5k". Hiding beats printing a wrong number. */
export default function PricingMatrix({
  plans,
  matrix,
  rateCard,
  defaultCurrency = "INR",
}: {
  plans: (PlanDef & { period?: string })[];
  matrix: MatrixRowDef[];
  rateCard: RateRowDef[];
  /* Chosen from the visitor's country at the edge: India gets rupees,
     everywhere else dollars. Only the initial value — the toggle below
     always wins, because IP geolocation is wrong often enough (VPNs,
     corporate proxies, roaming SIMs) to need an escape hatch. */
  defaultCurrency?: Currency;
}) {
  const [quarterly, setQuarterly] = useState(true);
  const [usd, setUsd] = useState(defaultCurrency === "USD");
  const hasQuarterly = plans.some((p) => p.quarterlyPrice);
  const cols = plans.length;

  /* An owner-entered USD string always beats the rate conversion — a pricing
     page wants round marketing numbers, not $229.88. The conversion is the
     fallback so the toggle still works on rows nobody has priced yet. */
  const money = (inr: string, explicitUsd?: string) =>
    usd ? explicitUsd?.trim() || inrToUsdDisplay(inr) : inr;
  const priceFor = (p: PlanDef) =>
    quarterly && p.quarterlyPrice
      ? money(p.quarterlyPrice, p.quarterlyPriceUsd)
      : money(p.price, p.priceUsd);

  const colCls = (i: number, extra = "") => {
    const p = plans[i];
    return `${extra} ${
      p.featured
        ? "bg-[#FFF7F0] border-x-2 border-[#F26419]"
        : ""
    }`;
  };

  const pillCls = (on: boolean) =>
    `cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
      on ? "bg-[#FDBA74] text-stone-900" : "text-stone-400 hover:text-white"
    }`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {hasQuarterly && (
          <div className="inline-flex items-center gap-1 rounded-full bg-stone-800 p-1">
            <button onClick={() => setQuarterly(false)} className={pillCls(!quarterly)}>
              Monthly
            </button>
            <button onClick={() => setQuarterly(true)} className={pillCls(quarterly)}>
              Quarterly <span className="font-bold text-orange-900">save ~12%</span>
            </button>
          </div>
        )}
        <div className="inline-flex items-center gap-1 rounded-full bg-stone-800 p-1">
          <button onClick={() => setUsd(false)} className={pillCls(!usd)} aria-pressed={!usd}>
            ₹ INR
          </button>
          <button onClick={() => setUsd(true)} className={pillCls(usd)} aria-pressed={usd}>
            $ USD
          </button>
        </div>
      </div>
      {usd && (
        <p className="mt-3 text-center text-xs text-stone-500">
          USD prices are approximate (₹{USD_RATE}/$) — your invoice states the exact
          amount, billed in INR or USD via PayPal or wire.
        </p>
      )}

      {/* pt-4 gives the floating RECOMMENDED badge headroom — the scroll
          container clips anything above the grid. */}
      <div className="mt-8 overflow-x-auto pt-4">
        <div
          className="min-w-[720px]"
          style={{ display: "grid", gridTemplateColumns: `1.2fr repeat(${cols}, 1fr)` }}
        >
          {/* Plan headers */}
          <div />
          {plans.map((p, i) => (
            <div
              key={p.name}
              className={colCls(i, `relative rounded-t-2xl px-4 pb-4 pt-6 text-center ${p.featured ? "border-t-2" : ""}`)}
            >
              {p.featured && (
                <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[#F26419] px-3 py-1 text-[10px] font-bold text-white">
                  RECOMMENDED
                </span>
              )}
              <p className="font-display text-sm font-bold text-stone-900">{p.name}</p>
              <p className="font-display mt-1 text-2xl font-extrabold text-stone-900">
                {priceFor(p)}
                {p.period && <span className="text-xs font-medium text-stone-400">{p.period}</span>}
              </p>
              {quarterly && p.quarterlyPrice && p.quarterlyPrice !== p.price && (
                <p className="text-[11px] text-stone-400">
                  <s>{money(p.price, p.priceUsd)}</s> billed quarterly
                </p>
              )}
              {p.tagline && <p className="mt-1 text-[11px] leading-snug text-stone-500">{p.tagline}</p>}
              {!usd && p.marketNote && (
                <p className="mt-1.5 text-[11px] font-medium text-emerald-700">{p.marketNote}</p>
              )}
            </div>
          ))}

          {/* Feature rows */}
          {matrix.map((row) => (
            <div key={row.label} className="contents">
              <div className="flex items-center gap-1.5 border-t border-stone-100 px-3 py-3 text-sm text-stone-600">
                {row.label}
                {row.tooltip && (
                  <span title={row.tooltip} className="cursor-help text-stone-300">
                    <Info size={12} aria-label={row.tooltip} />
                  </span>
                )}
              </div>
              {plans.map((p, i) => {
                const v = row.values[i] ?? "—";
                return (
                  <div
                    key={p.name + row.label}
                    className={colCls(i, "border-t px-3 py-3 text-center text-sm " + (p.featured ? "border-t-[#FFE3CC]" : "border-t-stone-100"))}
                  >
                    <span
                      className={
                        v === "—"
                          ? "text-stone-300"
                          : v.startsWith("✓")
                            ? "font-medium text-emerald-700"
                            : "font-medium text-stone-800"
                      }
                    >
                      {v}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}

          {/* CTA row */}
          <div />
          {plans.map((p, i) => (
            <div
              key={p.name + "-cta"}
              className={colCls(i, `rounded-b-2xl px-4 py-5 text-center ${p.featured ? "border-b-2" : ""}`)}
            >
              <Link
                href="/contact"
                className={`inline-block rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${
                  p.featured
                    ? "bg-[#F26419] text-white hover:bg-orange-600"
                    : "border border-[#F26419] text-[#F26419] hover:bg-orange-50"
                }`}
              >
                {p.cta ?? "Choose plan"}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Risk reversal */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-dashed border-stone-200 pt-6 text-sm text-stone-600">
        <span className="flex items-center gap-1.5">
          <PauseCircle size={15} className="text-[#F26419]" aria-hidden /> Pause with 30 days notice
        </span>
        <span className="flex items-center gap-1.5">
          <FileSearch size={15} className="text-[#F26419]" aria-hidden /> Free 15-page audit before you pay
        </span>
        <span className="flex items-center gap-1.5">
          <ChartLine size={15} className="text-[#F26419]" aria-hidden /> Avg client: 5.8× ROAS
        </span>
      </div>

      {/* Rate card */}
      <h2 className="font-display mt-16 text-center text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
        Buying one thing?{" "}
        <span className="font-serif-accent font-medium italic text-orange-600">
          Straight rates.
        </span>
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-stone-600">
        Every project runs on a fixed quote agreed before work starts — the
        grey line under each rate is what the Indian market charges for the
        same scope.
      </p>
      <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="grid lg:grid-cols-2">
          {rateCard.map((r, i) => (
            <div
              key={r.label}
              className={`flex items-center justify-between gap-6 border-t border-stone-100 px-6 py-4 transition-colors hover:bg-[#FFFBF7] ${
                i === 0 ? "border-t-0" : ""
              } ${i === 1 ? "lg:border-t-0" : ""} ${
                i % 2 === 1 ? "lg:border-l lg:border-l-stone-100" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-stone-900">{r.label}</p>
                {!usd && r.marketNote && (
                  <p className="mt-0.5 text-xs text-stone-400">{r.marketNote}</p>
                )}
              </div>
              <span className="font-display shrink-0 text-sm font-bold text-emerald-700">
                {money(r.price, r.priceUsd)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
