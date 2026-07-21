"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

/* Marketing KPI dashboard — enter each month's numbers, get the derived
   metrics (CPL, CAC, conversion rate, ROAS) and a simple trend. Saved on
   this device only. */

type Row = { month: string; spend: string; leads: string; customers: string; revenue: string };

const STORE = "ds-kpi-rows";
const blank = (month: string): Row => ({ month, spend: "", leads: "", customers: "", revenue: "" });

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function initialRows(): Row[] {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORE);
      if (saved) return JSON.parse(saved) as Row[];
    } catch {
      /* ignore */
    }
  }
  return [blank("Month 1"), blank("Month 2"), blank("Month 3")];
}

const n = (v: string) => Number(String(v).replace(/[^\d.]/g, "")) || 0;
const inr = (v: number) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${Math.round(v).toLocaleString("en-IN")}`;

export default function KpiDashboard() {
  const [rows, setRows] = useState<Row[]>(initialRows);

  const persist = (next: Row[]) => {
    setRows(next);
    try {
      localStorage.setItem(STORE, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const setCell = (i: number, key: keyof Row, value: string) =>
    persist(rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));

  const calc = useMemo(
    () =>
      rows.map((r) => {
        const spend = n(r.spend);
        const leads = n(r.leads);
        const customers = n(r.customers);
        const revenue = n(r.revenue);
        return {
          ...r,
          cpl: leads ? spend / leads : 0,
          cac: customers ? spend / customers : 0,
          conv: leads ? (customers / leads) * 100 : 0,
          roas: spend ? revenue / spend : 0,
          revenue,
        };
      }),
    [rows],
  );

  const totals = useMemo(() => {
    const spend = calc.reduce((s, r) => s + n(r.spend), 0);
    const leads = calc.reduce((s, r) => s + n(r.leads), 0);
    const customers = calc.reduce((s, r) => s + n(r.customers), 0);
    const revenue = calc.reduce((s, r) => s + r.revenue, 0);
    return {
      spend,
      leads,
      customers,
      revenue,
      cpl: leads ? spend / leads : 0,
      roas: spend ? revenue / spend : 0,
      conv: leads ? (customers / leads) * 100 : 0,
    };
  }, [calc]);

  const maxRoas = Math.max(1, ...calc.map((r) => r.roas));
  const field =
    "w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-orange-500";

  return (
    <div className="rounded-[2rem] bg-[#FFF6EF] p-6 sm:p-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Cost per lead" value={totals.cpl ? inr(totals.cpl) : "—"} />
        <Stat label="Lead → customer" value={totals.conv ? `${totals.conv.toFixed(1)}%` : "—"} />
        <Stat label="Revenue" value={totals.revenue ? inr(totals.revenue) : "—"} />
        <Stat label="ROAS" value={totals.roas ? `${totals.roas.toFixed(1)}×` : "—"} accent />
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-stone-500">
              <th className="pb-2 font-semibold">Month</th>
              <th className="pb-2 font-semibold">Spend ₹</th>
              <th className="pb-2 font-semibold">Leads</th>
              <th className="pb-2 font-semibold">Customers</th>
              <th className="pb-2 font-semibold">Revenue ₹</th>
              <th className="pb-2 text-right font-semibold">CPL</th>
              <th className="pb-2 text-right font-semibold">ROAS</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {calc.map((r, i) => (
              <tr key={i} className="border-t border-stone-200">
                <td className="py-2 pr-2">
                  <input value={r.month} onChange={(e) => setCell(i, "month", e.target.value)} className={field} />
                </td>
                <td className="py-2 pr-2">
                  <input value={r.spend} onChange={(e) => setCell(i, "spend", e.target.value)} inputMode="decimal" className={field} />
                </td>
                <td className="py-2 pr-2">
                  <input value={r.leads} onChange={(e) => setCell(i, "leads", e.target.value)} inputMode="decimal" className={field} />
                </td>
                <td className="py-2 pr-2">
                  <input value={r.customers} onChange={(e) => setCell(i, "customers", e.target.value)} inputMode="decimal" className={field} />
                </td>
                <td className="py-2 pr-2">
                  <input value={r.revenue} onChange={(e) => setCell(i, "revenue", e.target.value)} inputMode="decimal" className={field} />
                </td>
                <td className="py-2 text-right font-semibold text-stone-700">{r.cpl ? inr(r.cpl) : "—"}</td>
                <td className="py-2 text-right">
                  <span className="font-semibold text-emerald-700">{r.roas ? `${r.roas.toFixed(1)}×` : "—"}</span>
                  <span className="mt-1 block h-1 rounded-full bg-stone-200">
                    <span
                      className="block h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, (r.roas / maxRoas) * 100)}%` }}
                    />
                  </span>
                </td>
                <td className="py-2 pl-2 text-right">
                  <button
                    onClick={() => rows.length > 1 && persist(rows.filter((_, idx) => idx !== i))}
                    aria-label={`Remove ${r.month}`}
                    className="cursor-pointer text-stone-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => persist([...rows, blank(MONTHS[rows.length % 12])])}
        className="mt-3 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[#F26419] hover:underline"
      >
        <Plus size={13} /> Add month
      </button>

      <p className="mt-5 text-xs leading-relaxed text-stone-500">
        Saved on this device only — nothing is uploaded. ROAS below 1× means the campaign is losing
        money; CPL rising while conversion holds usually points at auction competition, not creative.
      </p>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-[11px] uppercase tracking-wide text-stone-500">{label}</p>
      <p
        className={`font-display mt-0.5 text-xl font-extrabold ${accent ? "text-emerald-600" : "text-stone-900"}`}
      >
        {value}
      </p>
    </div>
  );
}
