"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, FileText, Plus, Printer, Trash2 } from "lucide-react";
import { withBase } from "@/lib/base-path";
import Attachments from "@/components/admin/Attachments";
import {
  QUOTE_STATUS_STYLE,
  TAX_MODES,
  TAX_MODE_LABEL,
  computeTotals,
  formatMoney,
  lineNet,
  quoteRef,
  quoteStatusLabel,
  type QuoteItem,
  type TaxModeKey,
} from "@/lib/quotations";

type QuoteData = {
  id?: string;
  number?: string;
  version?: number;
  status?: string;
  leadId?: string | null;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientGstin: string;
  title: string;
  notes: string;
  currency: string;
  items: QuoteItem[];
  discountPct: number;
  taxRatePct: number;
  taxMode: string;
  validUntil: string; // yyyy-mm-dd or ""
};

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-orange-500 disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

const EDITABLE = new Set(["DRAFT", "PENDING_APPROVAL", "REJECTED"]);
const blankItem = (): QuoteItem => ({ description: "", qty: 1, unitPrice: 0, discountPct: 0 });

export default function QuotationEditor({
  initial,
  canApprove = false,
}: {
  initial: QuoteData;
  canApprove?: boolean;
}) {
  const router = useRouter();
  const isNew = !initial.id;
  const [q, setQ] = useState<QuoteData>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const locked = !isNew && !EDITABLE.has(q.status ?? "DRAFT");
  const set = <K extends keyof QuoteData>(k: K, v: QuoteData[K]) => setQ((p) => ({ ...p, [k]: v }));

  const totals = useMemo(
    () => computeTotals(q.items, q.discountPct, q.taxRatePct, q.taxMode),
    [q.items, q.discountPct, q.taxRatePct, q.taxMode],
  );

  function setItem(i: number, patch: Partial<QuoteItem>) {
    setQ((p) => ({ ...p, items: p.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }));
  }
  const addItem = () => setQ((p) => ({ ...p, items: [...p.items, blankItem()] }));
  const removeItem = (i: number) => setQ((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  function payload() {
    return {
      leadId: q.leadId ?? null,
      clientName: q.clientName.trim(),
      clientCompany: q.clientCompany || null,
      clientEmail: q.clientEmail || null,
      clientPhone: q.clientPhone || null,
      clientAddress: q.clientAddress || null,
      clientGstin: q.clientGstin || null,
      title: q.title,
      notes: q.notes,
      currency: q.currency,
      items: q.items.map((it) => ({
        description: it.description,
        qty: Number(it.qty) || 0,
        unitPrice: Number(it.unitPrice) || 0,
        discountPct: Number(it.discountPct) || 0,
      })),
      discountPct: Number(q.discountPct) || 0,
      taxRatePct: Number(q.taxRatePct) || 0,
      taxMode: q.taxMode,
      validUntil: q.validUntil ? new Date(q.validUntil).toISOString() : null,
    };
  }

  async function save() {
    if (!q.clientName.trim()) { setMsg("Client name is required."); return; }
    setBusy(true); setMsg("");
    try {
      const res = await fetch(
        withBase(isNew ? "/api/quotations" : `/api/quotations/${initial.id}`),
        { method: isNew ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload()) },
      );
      const json = await res.json();
      if (!json.ok) { setMsg(json.error ?? "Save failed."); return; }
      if (isNew) router.push(`/admin/quotations/${json.id}`);
      else { setMsg("Saved."); router.refresh(); }
    } finally { setBusy(false); }
  }

  async function transition(status: string) {
    setBusy(true); setMsg("");
    try {
      const res = await fetch(withBase(`/api/quotations/${initial.id}/status`), {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json.ok) setMsg(json.error ?? "Failed.");
      else { setQ((p) => ({ ...p, status })); router.refresh(); }
    } finally { setBusy(false); }
  }

  async function revise() {
    setBusy(true); setMsg("");
    try {
      const res = await fetch(withBase(`/api/quotations/${initial.id}/revise`), { method: "POST" });
      const json = await res.json();
      if (json.ok) router.push(`/admin/quotations/${json.id}`);
      else setMsg(json.error ?? "Failed.");
    } finally { setBusy(false); }
  }

  async function remove() {
    if (!window.confirm("Delete this quotation?")) return;
    const res = await fetch(withBase(`/api/quotations/${initial.id}`), { method: "DELETE" });
    const json = await res.json();
    if (json.ok) router.push("/admin/quotations");
    else setMsg(json.error ?? "Failed.");
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/quotations" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-orange-600">
          <ArrowLeft size={15} /> All quotations
        </Link>
        {!isNew && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold">{quoteRef(q.number ?? "", q.version ?? 1)}</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${QUOTE_STATUS_STYLE[(q.status ?? "DRAFT") as keyof typeof QUOTE_STATUS_STYLE]}`}>
              {quoteStatusLabel(q.status ?? "DRAFT")}
            </span>
          </div>
        )}
      </div>

      <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight">
        {isNew ? "New quotation" : "Quotation"}
      </h1>

      {/* Actions bar (existing quote) */}
      {!isNew && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
          {q.status === "DRAFT" && <Action onClick={() => transition("PENDING_APPROVAL")} busy={busy}>Submit for approval</Action>}
          {q.status === "PENDING_APPROVAL" && canApprove && <Action onClick={() => transition("APPROVED")} busy={busy} tone="green">Approve</Action>}
          {q.status === "PENDING_APPROVAL" && canApprove && <Action onClick={() => transition("REJECTED")} busy={busy} tone="red">Reject</Action>}
          {(q.status === "APPROVED" || q.status === "DRAFT") && <Action onClick={() => transition("SENT")} busy={busy}>Mark sent</Action>}
          {q.status === "SENT" && <Action onClick={() => transition("ACCEPTED")} busy={busy} tone="green">Mark accepted</Action>}
          {q.status === "SENT" && <Action onClick={() => transition("REJECTED")} busy={busy} tone="red">Mark rejected</Action>}
          <a href={withBase(`/admin/quote-print/${initial.id}`)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:border-orange-400 hover:text-orange-600 dark:border-stone-700 dark:text-stone-300">
            <Printer size={13} /> Print / PDF
          </a>
          <button onClick={() => void revise()} disabled={busy} className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:border-orange-400 hover:text-orange-600 dark:border-stone-700 dark:text-stone-300">
            <Copy size={13} /> Revise
          </button>
          <button onClick={() => void remove()} disabled={busy} className="ml-auto flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-400 hover:border-red-400 hover:text-red-600 dark:border-stone-700">
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}
      {locked && <p className="mt-2 text-xs text-amber-600">This quotation is locked. Use <strong>Revise</strong> to create an editable version.</p>}

      {/* Client + meta */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card title="Client">
          <Grid>
            <Field label="Name *"><input value={q.clientName} disabled={locked} onChange={(e) => set("clientName", e.target.value)} className={inputCls} /></Field>
            <Field label="Company"><input value={q.clientCompany} disabled={locked} onChange={(e) => set("clientCompany", e.target.value)} className={inputCls} /></Field>
            <Field label="Email"><input value={q.clientEmail} disabled={locked} onChange={(e) => set("clientEmail", e.target.value)} className={inputCls} /></Field>
            <Field label="Phone"><input value={q.clientPhone} disabled={locked} onChange={(e) => set("clientPhone", e.target.value)} className={inputCls} /></Field>
            <Field label="GSTIN"><input value={q.clientGstin} disabled={locked} onChange={(e) => set("clientGstin", e.target.value)} className={inputCls} /></Field>
            <Field label="Valid until"><input type="date" value={q.validUntil} disabled={locked} onChange={(e) => set("validUntil", e.target.value)} className={inputCls} /></Field>
            <Field label="Address" full><textarea value={q.clientAddress} disabled={locked} onChange={(e) => set("clientAddress", e.target.value)} rows={2} className={inputCls} /></Field>
          </Grid>
        </Card>

        <Card title="Quotation">
          <Grid>
            <Field label="Title" full><input value={q.title} disabled={locked} onChange={(e) => set("title", e.target.value)} placeholder="e.g. SEO + PPC retainer — Q3" className={inputCls} /></Field>
            <Field label="Currency"><input value={q.currency} disabled={locked} onChange={(e) => set("currency", e.target.value.toUpperCase().slice(0, 4))} className={inputCls} /></Field>
            <Field label="Tax mode">
              <select value={q.taxMode} disabled={locked} onChange={(e) => set("taxMode", e.target.value as TaxModeKey)} className={inputCls}>
                {TAX_MODES.map((m) => <option key={m} value={m}>{TAX_MODE_LABEL[m]}</option>)}
              </select>
            </Field>
            <Field label="Tax rate %"><input type="number" min={0} max={100} value={q.taxRatePct} disabled={locked || q.taxMode === "NONE"} onChange={(e) => set("taxRatePct", Number(e.target.value))} className={inputCls} /></Field>
            <Field label="Overall discount %"><input type="number" min={0} max={100} value={q.discountPct} disabled={locked} onChange={(e) => set("discountPct", Number(e.target.value))} className={inputCls} /></Field>
            <Field label="Notes / terms" full><textarea value={q.notes} disabled={locked} onChange={(e) => set("notes", e.target.value)} rows={2} className={inputCls} placeholder="Payment terms, scope notes…" /></Field>
          </Grid>
        </Card>
      </div>

      {/* Line items */}
      <Card title="Line items" className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-stone-400">
                <th className="py-1.5 pr-2">Description</th>
                <th className="w-16 py-1.5 px-1 text-right">Qty</th>
                <th className="w-28 py-1.5 px-1 text-right">Unit price</th>
                <th className="w-16 py-1.5 px-1 text-right">Disc %</th>
                <th className="w-28 py-1.5 pl-1 text-right">Amount</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {q.items.map((it, i) => (
                <tr key={i} className="border-t border-stone-100 dark:border-stone-800">
                  <td className="py-1.5 pr-2"><input value={it.description} disabled={locked} onChange={(e) => setItem(i, { description: e.target.value })} placeholder="Service / deliverable" className={inputCls} /></td>
                  <td className="px-1 py-1.5"><input type="number" min={0} value={it.qty} disabled={locked} onChange={(e) => setItem(i, { qty: Number(e.target.value) })} className={`${inputCls} text-right`} /></td>
                  <td className="px-1 py-1.5"><input type="number" min={0} value={it.unitPrice} disabled={locked} onChange={(e) => setItem(i, { unitPrice: Number(e.target.value) })} className={`${inputCls} text-right`} /></td>
                  <td className="px-1 py-1.5"><input type="number" min={0} max={100} value={it.discountPct} disabled={locked} onChange={(e) => setItem(i, { discountPct: Number(e.target.value) })} className={`${inputCls} text-right`} /></td>
                  <td className="py-1.5 pl-1 text-right font-medium tabular-nums">{formatMoney(lineNet(it), q.currency)}</td>
                  <td className="text-center">{!locked && <button onClick={() => removeItem(i)} className="text-stone-300 hover:text-red-500" aria-label="Remove line"><Trash2 size={14} /></button>}</td>
                </tr>
              ))}
              {q.items.length === 0 && (
                <tr><td colSpan={6} className="py-4 text-center text-xs text-stone-400">No line items yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {!locked && (
          <button onClick={addItem} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:underline">
            <Plus size={13} /> Add line
          </button>
        )}

        {/* Totals */}
        <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
          <Row label="Subtotal" value={formatMoney(totals.subtotal, q.currency)} />
          {totals.discountAmount > 0 && <Row label={`Discount (${q.discountPct}%)`} value={`− ${formatMoney(totals.discountAmount, q.currency)}`} />}
          {q.taxMode === "CGST_SGST" && <><Row label={`CGST (${q.taxRatePct / 2}%)`} value={formatMoney(totals.cgst, q.currency)} /><Row label={`SGST (${q.taxRatePct / 2}%)`} value={formatMoney(totals.sgst, q.currency)} /></>}
          {q.taxMode === "IGST" && <Row label={`IGST (${q.taxRatePct}%)`} value={formatMoney(totals.igst, q.currency)} />}
          <div className="flex items-center justify-between border-t border-stone-200 pt-1.5 text-base font-bold dark:border-stone-700">
            <span>Total</span><span className="tabular-nums">{formatMoney(totals.total, q.currency)}</span>
          </div>
        </div>
      </Card>

      {/* Files */}
      {!isNew && (
        <div className="mt-4">
          <Attachments quotationId={initial.id} canEdit={!locked} />
        </div>
      )}

      {/* Save */}
      {!locked && (
        <div className="mt-4 flex items-center gap-3">
          <button onClick={() => void save()} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50">
            <FileText size={15} /> {busy ? "Saving…" : isNew ? "Create quotation" : "Save changes"}
          </button>
          {msg && <span className="text-xs font-semibold text-stone-500">{msg}</span>}
        </div>
      )}
      {locked && msg && <p className="mt-3 text-xs font-semibold text-stone-500">{msg}</p>}
    </div>
  );
}

function Action({ onClick, busy, children, tone }: { onClick: () => void; busy: boolean; children: React.ReactNode; tone?: "green" | "red" }) {
  const cls = tone === "green"
    ? "bg-green-600 text-white hover:bg-green-500"
    : tone === "red"
      ? "bg-red-600 text-white hover:bg-red-500"
      : "bg-stone-900 text-white hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900";
  return <button onClick={onClick} disabled={busy} className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${cls}`}>{children}</button>;
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900 ${className}`}>
      <h2 className="mb-3 font-display text-sm font-bold">{title}</h2>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}
function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">{label}</label>
      {children}
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between text-stone-600 dark:text-stone-300"><span>{label}</span><span className="tabular-nums">{value}</span></div>;
}
