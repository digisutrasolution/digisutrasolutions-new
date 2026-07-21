"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";

/* GST calculator — add GST to a base amount or strip it out of a total,
   with the CGST/SGST or IGST split shown. Pure client-side arithmetic. */

const RATES = [0.25, 3, 5, 12, 18, 28];

const inr = (v: number) =>
  `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function GstCalculator() {
  const [amount, setAmount] = useState("10000");
  const [rate, setRate] = useState(18);
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [interState, setInterState] = useState(false);

  const r = useMemo(() => {
    const value = Number(amount.replace(/[^\d.]/g, "")) || 0;
    const base = mode === "add" ? value : value / (1 + rate / 100);
    const tax = mode === "add" ? (value * rate) / 100 : value - base;
    return { base, tax, total: base + tax, half: tax / 2 };
  }, [amount, rate, mode]);

  return (
    <div className="grid gap-6 rounded-[2rem] bg-[#FFF6EF] p-6 sm:p-8 lg:grid-cols-[1fr_1fr] lg:gap-10">
      <div>
        <label className="block">
          <span className="text-sm font-semibold text-stone-700">
            {mode === "add" ? "Amount before GST" : "Total including GST"}
          </span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-lg font-semibold text-stone-900 outline-none transition-colors focus:border-orange-500"
          />
        </label>

        <button
          onClick={() => setMode((m) => (m === "add" ? "remove" : "add"))}
          className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[#F26419] hover:underline"
        >
          <ArrowLeftRight size={13} aria-hidden />
          {mode === "add" ? "Switch to removing GST from a total" : "Switch to adding GST"}
        </button>

        <p className="mt-6 text-sm font-semibold text-stone-700">GST rate</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {RATES.map((x) => (
            <button
              key={x}
              onClick={() => setRate(x)}
              aria-pressed={rate === x}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                rate === x
                  ? "bg-[#F26419] text-white"
                  : "border border-stone-300 bg-white text-stone-700 hover:border-[#F26419]"
              }`}
            >
              {x}%
            </button>
          ))}
        </div>

        <label className="mt-5 flex cursor-pointer items-center gap-2.5 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={interState}
            onChange={(e) => setInterState(e.target.checked)}
            className="h-4 w-4 accent-[#F26419]"
          />
          Inter-state supply (IGST instead of CGST + SGST)
        </label>
      </div>

      <div className="rounded-2xl bg-stone-900 p-5 sm:p-6">
        <Row label="Taxable value" value={inr(r.base)} />
        {interState ? (
          <Row label={`IGST @ ${rate}%`} value={inr(r.tax)} accent />
        ) : (
          <>
            <Row label={`CGST @ ${rate / 2}%`} value={inr(r.half)} accent />
            <Row label={`SGST @ ${rate / 2}%`} value={inr(r.half)} accent />
          </>
        )}
        <div className="mt-3 border-t border-stone-700 pt-3">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm font-semibold text-white">Total</span>
            <span className="font-display text-2xl font-extrabold text-emerald-400">
              {inr(r.total)}
            </span>
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-stone-500">
          Rates shown are the standard GST slabs. Confirm the slab that applies to your HSN/SAC
          code with your accountant before invoicing.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-sm text-stone-400">{label}</span>
      <span className={`text-sm font-semibold ${accent ? "text-[#FDBA74]" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}
