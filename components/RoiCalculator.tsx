"use client";

import { withBase } from "@/lib/base-path";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Info } from "lucide-react";
import {
  ROI_ASSUMPTIONS,
  ROI_DEFAULTS,
  ROI_LIMITS,
  calculateRoi,
  inrShort,
  type RoiInputs,
} from "@/lib/roi";

/* Live ROI projection. Every figure is a range with the assumptions on
   screen — see lib/roi.ts. Requesting the plan writes a Lead with source
   ESTIMATOR, carrying the inputs and the modelled range. */
export default function RoiCalculator({ compact = false }: { compact?: boolean }) {
  const [inputs, setInputs] = useState<RoiInputs>(ROI_DEFAULTS);
  const [lead, setLead] = useState({ name: "", whatsapp: "", hp: "" });
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const r = useMemo(() => calculateRoi(inputs), [inputs]);
  const set = (key: keyof RoiInputs) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setInputs((p) => ({ ...p, [key]: Number(e.target.value) }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setError("");
    try {
      const summary = [
        `ROI calculator — budget ${inrShort(inputs.budget)}/mo`,
        `average order value ${inrShort(inputs.orderValue)}`,
        `close rate ${Math.round(inputs.closeRate * 100)}%`,
        `modelled revenue ${inrShort(r.revenueLow)}–${inrShort(r.revenueHigh)}/mo`,
        `${r.leadsLow}–${r.leadsHigh} enquiries/mo`,
      ].join(" · ");
      const res = await fetch(withBase("/api/leads"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          whatsapp: lead.whatsapp,
          budget: `${inrShort(inputs.budget)}/mo`,
          message: summary,
          source: "ESTIMATOR",
          hp: lead.hp,
          startedAt: startedAt.current,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Couldn't send that — try WhatsApp instead.");
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("Network error — try WhatsApp instead.");
      setState("idle");
    }
  }

  const sliderCls =
    "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#F0D9C4] accent-[#F26419]";

  return (
    <div
      className={`grid gap-6 rounded-[2rem] bg-[#FFF6EF] p-6 sm:p-8 ${
        compact ? "" : "lg:grid-cols-[1.05fr_1fr] lg:gap-10"
      }`}
    >
      {/* Inputs */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
          ROI calculator
        </p>
        <h3 className="font-display mt-2 text-2xl font-extrabold tracking-tight text-stone-900">
          What could this budget{" "}
          <span className="font-serif-accent font-medium italic text-orange-600">return?</span>
        </h3>

        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="flex items-baseline justify-between text-sm text-stone-600">
              Monthly marketing budget
              <b className="font-display text-base font-bold text-stone-900">
                {inrShort(inputs.budget)}
              </b>
            </span>
            <input
              type="range"
              value={inputs.budget}
              onChange={set("budget")}
              min={ROI_LIMITS.budget.min}
              max={ROI_LIMITS.budget.max}
              step={ROI_LIMITS.budget.step}
              className={`mt-2 ${sliderCls}`}
            />
          </label>

          <label className="block">
            <span className="flex items-baseline justify-between text-sm text-stone-600">
              Average order / deal value
              <b className="font-display text-base font-bold text-stone-900">
                {inrShort(inputs.orderValue)}
              </b>
            </span>
            <input
              type="range"
              value={inputs.orderValue}
              onChange={set("orderValue")}
              min={ROI_LIMITS.orderValue.min}
              max={ROI_LIMITS.orderValue.max}
              step={ROI_LIMITS.orderValue.step}
              className={`mt-2 ${sliderCls}`}
            />
          </label>

          <label className="block">
            <span className="flex items-baseline justify-between text-sm text-stone-600">
              Enquiries you close
              <b className="font-display text-base font-bold text-stone-900">
                {Math.round(inputs.closeRate * 100)}%
              </b>
            </span>
            <input
              type="range"
              value={inputs.closeRate}
              onChange={set("closeRate")}
              min={ROI_LIMITS.closeRate.min}
              max={ROI_LIMITS.closeRate.max}
              step={ROI_LIMITS.closeRate.step}
              className={`mt-2 ${sliderCls}`}
            />
          </label>
        </div>
      </div>

      {/* Outputs */}
      <div className="rounded-2xl bg-stone-900 p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Enquiries / month" value={`${r.leadsLow}–${r.leadsHigh}`} />
          <Stat label="New orders / month" value={`${r.ordersLow}–${r.ordersHigh}`} />
          <Stat
            label="Revenue / month"
            value={`${inrShort(r.revenueLow)}–${inrShort(r.revenueHigh)}`}
            tone="emerald"
          />
          <Stat label="Return on budget" value={`${r.roasLow}×–${r.roasHigh}×`} tone="emerald" />
        </div>

        <p className="mt-4 rounded-xl bg-white/5 px-3.5 py-2.5 text-xs leading-relaxed text-stone-400">
          After the {inrShort(inputs.budget)} budget, that&rsquo;s{" "}
          <b className="font-semibold text-emerald-400">
            {inrShort(r.netLow)}–{inrShort(r.netHigh)}
          </b>{" "}
          left over each month.
        </p>

        {state === "done" ? (
          <p className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3.5 py-3 text-sm font-semibold text-emerald-300">
            <Check size={15} aria-hidden /> Sent — we&rsquo;ll WhatsApp you the plan behind these
            numbers.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-5">
            <p className="text-sm font-semibold text-white">
              Want the plan that gets you there?
            </p>
            <input
              type="text"
              value={lead.hp}
              onChange={(e) => setLead((p) => ({ ...p, hp: e.target.value }))}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />
            <div className="mt-2.5 space-y-2">
              <input
                required
                value={lead.name}
                onChange={(e) => setLead((p) => ({ ...p, name: e.target.value }))}
                placeholder="Your name"
                className="h-11 w-full rounded-full border border-stone-700 bg-stone-800 px-4 text-sm text-white outline-none transition-colors placeholder:text-stone-500 focus:border-[#F26419]"
              />
              <div className="flex gap-2">
                <input
                  required
                  type="tel"
                  value={lead.whatsapp}
                  onChange={(e) => setLead((p) => ({ ...p, whatsapp: e.target.value }))}
                  placeholder="WhatsApp number"
                  className="h-11 w-full min-w-0 flex-1 rounded-full border border-stone-700 bg-stone-800 px-4 text-sm text-white outline-none transition-colors placeholder:text-stone-500 focus:border-[#F26419]"
                />
                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-[#F26419] px-5 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
                >
                  {state === "sending" ? "…" : "Send"}
                  <ArrowRight size={14} aria-hidden />
                </button>
              </div>
            </div>
            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          </form>
        )}

        <details className="mt-4 text-xs text-stone-500">
          <summary className="flex cursor-pointer items-center gap-1.5 font-semibold text-stone-400">
            <Info size={12} aria-hidden /> How this is calculated
          </summary>
          <ul className="mt-2 space-y-1.5 pl-1">
            {ROI_ASSUMPTIONS.map((a) => (
              <li key={a} className="leading-relaxed">
                · {a}
              </li>
            ))}
            <li className="leading-relaxed">
              · An estimate from client averages — results vary by market and offer, and this is
              not a guarantee.
            </li>
          </ul>
        </details>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "emerald";
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-stone-500">{label}</p>
      <p
        className={`font-display mt-0.5 text-xl font-extrabold tracking-tight sm:text-2xl ${
          tone === "emerald" ? "text-emerald-400" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
