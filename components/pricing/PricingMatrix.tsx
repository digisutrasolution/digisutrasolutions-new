"use client";

import { useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import type { MatrixRowDef, PlanDef } from "@/lib/pricing";

/* Billing toggle + plan header cards + feature comparison matrix. The
   recommended plan's column is lifted with an orange frame end to end. */
export default function PricingMatrix({
  plans,
  matrix,
}: {
  plans: (PlanDef & { period?: string })[];
  matrix: MatrixRowDef[];
}) {
  const [quarterly, setQuarterly] = useState(true);
  const hasQuarterly = plans.some((p) => p.quarterlyPrice);
  const cols = plans.length;

  const priceFor = (p: PlanDef) =>
    quarterly && p.quarterlyPrice ? p.quarterlyPrice : p.price;

  const colCls = (i: number, extra = "") => {
    const p = plans[i];
    return `${extra} ${
      p.featured
        ? "bg-[#FFF7F0] border-x-2 border-[#F26419]"
        : ""
    }`;
  };

  return (
    <div>
      {hasQuarterly && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full bg-stone-800 p-1">
            <button
              onClick={() => setQuarterly(false)}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                !quarterly ? "bg-[#FDBA74] text-stone-900" : "text-stone-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setQuarterly(true)}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                quarterly ? "bg-[#FDBA74] text-stone-900" : "text-stone-400 hover:text-white"
              }`}
            >
              Quarterly <span className="font-bold text-orange-900">save ~12%</span>
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 overflow-x-auto">
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
                  <s>{p.price}</s> billed quarterly
                </p>
              )}
              {p.tagline && <p className="mt-1 text-[11px] leading-snug text-stone-500">{p.tagline}</p>}
              {p.marketNote && (
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
    </div>
  );
}
