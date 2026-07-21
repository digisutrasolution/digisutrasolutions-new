"use client";

import { useMemo, useState } from "react";
import { Plus, Printer, Trash2 } from "lucide-react";

/* GST invoice generator — everything stays in the browser; the business
   block is remembered in localStorage so the next invoice is faster.
   "Print" opens the browser dialog, where "Save as PDF" is the usual
   choice, so we don't ship a PDF library. */

type Item = { desc: string; qty: string; rate: string };

const STORE_KEY = "ds-invoice-business";
const inr = (v: number) =>
  `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const field =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-orange-500";
const label = "mb-1 block text-xs font-semibold text-stone-500";

/* Read once, at module scope on the client — reading storage inside an
   effect would mean calling setState from the effect body. */
function savedBusiness() {
  if (typeof window === "undefined") return { name: "", address: "", gstin: "", contact: "" };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as { name: string; address: string; gstin: string; contact: string };
  } catch {
    /* ignore */
  }
  return { name: "", address: "", gstin: "", contact: "" };
}

export default function InvoiceGenerator() {
  const [biz, setBiz] = useState(savedBusiness);
  const [client, setClient] = useState({ name: "", address: "", gstin: "" });
  // Lazy initialiser: computed once on the client. The server renders an
  // empty date, so the input is marked to tolerate that difference.
  const [meta, setMeta] = useState(() => ({
    number: "INV-001",
    date: typeof window === "undefined" ? "" : new Date().toISOString().slice(0, 10),
    notes: "",
  }));
  const [items, setItems] = useState<Item[]>([{ desc: "", qty: "1", rate: "" }]);
  const [rate, setRate] = useState(18);
  const [interState, setInterState] = useState(false);

  const rememberBusiness = () => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(biz));
    } catch {
      /* ignore */
    }
  };

  const totals = useMemo(() => {
    const sub = items.reduce(
      (sum, i) => sum + (Number(i.qty) || 0) * (Number(i.rate) || 0),
      0,
    );
    const tax = (sub * rate) / 100;
    return { sub, tax, half: tax / 2, total: sub + tax };
  }, [items, rate]);

  const setItem = (i: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-8">
      {/* ---------- form ---------- */}
      <div className="no-print rounded-[2rem] bg-[#FFF6EF] p-6 sm:p-7">
        <p className="font-display text-sm font-bold text-stone-900">Your business</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label}>Business name</label>
            <input value={biz.name} onChange={(e) => setBiz({ ...biz, name: e.target.value })} onBlur={rememberBusiness} className={field} placeholder="DigiSutra Solutions" />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Address</label>
            <textarea value={biz.address} onChange={(e) => setBiz({ ...biz, address: e.target.value })} onBlur={rememberBusiness} className={`${field} min-h-16 resize-y`} placeholder="B-521, iThum Tower B, Sector 62, Noida" />
          </div>
          <div>
            <label className={label}>GSTIN</label>
            <input value={biz.gstin} onChange={(e) => setBiz({ ...biz, gstin: e.target.value })} onBlur={rememberBusiness} className={`${field} font-mono text-xs`} placeholder="09ABCDE1234F1Z5" />
          </div>
          <div>
            <label className={label}>Phone / email</label>
            <input value={biz.contact} onChange={(e) => setBiz({ ...biz, contact: e.target.value })} onBlur={rememberBusiness} className={field} placeholder="+91-120-475-1400" />
          </div>
        </div>

        <p className="font-display mt-6 text-sm font-bold text-stone-900">Bill to</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label}>Client name</label>
            <input value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} className={field} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Address</label>
            <textarea value={client.address} onChange={(e) => setClient({ ...client, address: e.target.value })} className={`${field} min-h-16 resize-y`} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Client GSTIN (optional)</label>
            <input value={client.gstin} onChange={(e) => setClient({ ...client, gstin: e.target.value })} className={`${field} font-mono text-xs`} />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>Invoice number</label>
            <input value={meta.number} onChange={(e) => setMeta({ ...meta, number: e.target.value })} className={field} />
          </div>
          <div>
            <label className={label}>Date</label>
            <input type="date" suppressHydrationWarning value={meta.date} onChange={(e) => setMeta({ ...meta, date: e.target.value })} className={field} />
          </div>
        </div>

        <p className="font-display mt-6 text-sm font-bold text-stone-900">Items</p>
        <div className="mt-3 space-y-2">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_60px_88px_auto] items-center gap-2">
              <input value={it.desc} onChange={(e) => setItem(i, { desc: e.target.value })} placeholder="Description" className={field} />
              <input value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value })} inputMode="decimal" placeholder="Qty" className={field} />
              <input value={it.rate} onChange={(e) => setItem(i, { rate: e.target.value })} inputMode="decimal" placeholder="Rate" className={field} />
              <button
                onClick={() => setItems((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : p))}
                aria-label="Remove item"
                className="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setItems((p) => [...p, { desc: "", qty: "1", rate: "" }])}
            className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[#F26419] hover:underline"
          >
            <Plus size={13} /> Add item
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div>
            <label className={label}>GST rate</label>
            <select value={rate} onChange={(e) => setRate(Number(e.target.value))} className={field}>
              {[0, 5, 12, 18, 28].map((r) => (
                <option key={r} value={r}>{r}%</option>
              ))}
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 pt-4 text-sm text-stone-700">
            <input type="checkbox" checked={interState} onChange={(e) => setInterState(e.target.checked)} className="h-4 w-4 accent-[#F26419]" />
            Inter-state (IGST)
          </label>
        </div>

        <div className="mt-4">
          <label className={label}>Notes / payment terms</label>
          <textarea value={meta.notes} onChange={(e) => setMeta({ ...meta, notes: e.target.value })} className={`${field} min-h-16 resize-y`} placeholder="Payable within 15 days. UPI: yourbusiness@bank" />
        </div>

        <button
          onClick={() => window.print()}
          className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#F26419] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600"
        >
          <Printer size={15} aria-hidden /> Print / Save as PDF
        </button>
        <p className="mt-2 text-xs text-stone-500">
          Choose &ldquo;Save as PDF&rdquo; in the print dialog. Your business details are remembered on this
          device only.
        </p>
      </div>

      {/* ---------- live preview (this is what prints) ---------- */}
      <div className="invoice-sheet rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-display text-lg font-extrabold text-stone-900">
              {biz.name || "Your business name"}
            </p>
            <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-stone-600">
              {biz.address || "Your address"}
            </p>
            {biz.gstin && <p className="mt-1 font-mono text-xs text-stone-600">GSTIN: {biz.gstin}</p>}
            {biz.contact && <p className="text-xs text-stone-600">{biz.contact}</p>}
          </div>
          <div className="text-right">
            <p className="font-display text-xl font-extrabold uppercase tracking-wide text-[#F26419]">
              Tax Invoice
            </p>
            <p className="mt-1 text-xs text-stone-600">No: {meta.number || "—"}</p>
            <p className="text-xs text-stone-600">
              Date: {meta.date ? new Date(meta.date).toLocaleDateString("en-IN") : "—"}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-stone-200 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Bill to</p>
          <p className="font-display mt-1 text-sm font-bold text-stone-900">
            {client.name || "Client name"}
          </p>
          <p className="whitespace-pre-line text-xs leading-relaxed text-stone-600">{client.address}</p>
          {client.gstin && <p className="font-mono text-xs text-stone-600">GSTIN: {client.gstin}</p>}
        </div>

        <table className="mt-5 w-full text-left">
          <thead>
            <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-400">
              <th className="pb-2 font-semibold">Description</th>
              <th className="pb-2 text-right font-semibold">Qty</th>
              <th className="pb-2 text-right font-semibold">Rate</th>
              <th className="pb-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-b border-stone-100">
                <td className="py-2 text-sm text-stone-800">{it.desc || "—"}</td>
                <td className="py-2 text-right text-sm text-stone-600">{it.qty || "0"}</td>
                <td className="py-2 text-right text-sm text-stone-600">{it.rate || "0"}</td>
                <td className="py-2 text-right text-sm font-semibold text-stone-900">
                  {inr((Number(it.qty) || 0) * (Number(it.rate) || 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-full max-w-[260px] space-y-1.5 text-sm">
          <Line label="Subtotal" value={inr(totals.sub)} />
          {interState ? (
            <Line label={`IGST ${rate}%`} value={inr(totals.tax)} />
          ) : (
            <>
              <Line label={`CGST ${rate / 2}%`} value={inr(totals.half)} />
              <Line label={`SGST ${rate / 2}%`} value={inr(totals.half)} />
            </>
          )}
          <div className="flex justify-between border-t border-stone-300 pt-2">
            <span className="font-display font-bold text-stone-900">Total</span>
            <span className="font-display font-extrabold text-stone-900">{inr(totals.total)}</span>
          </div>
        </div>

        {meta.notes && (
          <p className="mt-6 whitespace-pre-line border-t border-stone-200 pt-3 text-xs leading-relaxed text-stone-600">
            {meta.notes}
          </p>
        )}
      </div>
    </div>
  );
}

function Line({ label: l, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-stone-500">{l}</span>
      <span className="text-stone-800">{value}</span>
    </div>
  );
}
