"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Eye, FileText, Mail, Paperclip, Plus, Printer, Trash2 } from "lucide-react";
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
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-orange-500 disabled:cursor-not-allowed disabled:border-dashed disabled:bg-stone-100 disabled:text-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:disabled:bg-stone-800";

const EDITABLE = new Set(["DRAFT", "PENDING_APPROVAL", "REJECTED"]);
const blankItem = (): QuoteItem => ({ description: "", qty: 1, unitPrice: 0, discountPct: 0 });

type Send = {
  id: string; toAddress: string; subject: string; status: string;
  openedAt: string | null; attachments: string[]; userName: string | null; createdAt: string;
};
type QuoteFile = { id: string; originalName: string; size: number };

const MAX_TOTAL_BYTES = 10 * 1024 * 1024;
function fmtSize(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}
const fmtWhen = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

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

  /* Send state. Loaded lazily rather than passed from the server component,
     because it changes every time the client opens the link and the editor is
     the only place that cares. */
  const [sends, setSends] = useState<Send[]>([]);
  const [viewedAt, setViewedAt] = useState<string | null>(null);
  /* The exact link the client was given. Shown because the first version of
     this feature emailed a link that 404'd, and there was no way to tell from
     the admin — only from the client's inbox. */
  const [clientUrl, setClientUrl] = useState<string | null>(null);
  /* The client's own accept/reject. Worth showing separately from the status
     badge, which looks identical whether the client decided or we set it by
     hand. */
  const [decision, setDecision] = useState<null | { status: string; by: string | null; at: string | null; note: string | null }>(null);
  const [files, setFiles] = useState<QuoteFile[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [to, setTo] = useState(initial.clientEmail);
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  const ref = quoteRef(q.number ?? "", q.version ?? 1);
  const lastSend = sends[0];
  const opened = sends.find((s) => s.openedAt)?.openedAt ?? null;
  const selected = files.filter((f) => picked.includes(f.id));
  const totalBytes = selected.reduce((n, f) => n + f.size, 0);
  const overSize = totalBytes > MAX_TOTAL_BYTES;

  const loadSends = useCallback(async () => {
    if (isNew) return;
    const [s, f] = await Promise.all([
      fetch(withBase(`/api/quotations/${initial.id}/send`)).then((r) => r.json()).catch(() => ({ ok: false })),
      fetch(withBase(`/api/attachments?quotationId=${initial.id}`)).then((r) => r.json()).catch(() => ({ ok: false })),
    ]);
    if (s.ok) { setSends(s.sends); setViewedAt(s.viewedAt); setClientUrl(s.url ?? null); setDecision(s.decision ?? null); }
    if (f.ok) setFiles(f.attachments);
  }, [initial.id, isNew]);

  useEffect(() => {
    const t = setTimeout(() => void loadSends(), 0);
    return () => clearTimeout(t);
  }, [loadSends]);

  function openCompose() {
    setSubject(`Quotation ${ref} from DigiSutra Solutions`);
    setNote(
      `Hi ${(initial.clientName || "there").split(/\s+/)[0]},\n\n` +
        // No "click the button below" — the template supplies its own CTA.
        `Thank you for your time — your quotation is ready.\n\n` +
        `Do come back to us with any questions and we will be glad to walk you through it.\n\n` +
        `Best regards,\nDigiSutra Solutions`,
    );
    setMsg("");
    setComposeOpen(true);
  }

  async function sendToClient() {
    if (!to.trim()) { setMsg("A client email address is required."); return; }
    if (overSize) { setMsg(`Attachments total ${fmtSize(totalBytes)} — the limit is ${fmtSize(MAX_TOTAL_BYTES)}.`); return; }
    setBusy(true); setMsg("");
    try {
      const res = await fetch(withBase(`/api/quotations/${initial.id}/send`), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toAddress: to.trim(), subject, body: note, attachmentIds: picked }),
      });
      const json = await res.json();
      if (!json.ok) { setMsg(json.error ?? "Send failed."); return; }
      setMsg(`Sent to ${to.trim()}.`);
      setComposeOpen(false);
      setPicked([]);
      setQ((p) => ({ ...p, status: json.status }));
      await loadSends();
      router.refresh();
    } finally { setBusy(false); }
  }

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
          {/* The real send. "Mark sent" below only ever moved a status — a
              quotation was marked Sent and the client never heard from us. */}
          {q.status !== "SUPERSEDED" && (
            <button
              onClick={openCompose}
              disabled={busy || !q.clientEmail}
              title={q.clientEmail ? undefined : "Add a client email address first"}
              className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-500 disabled:opacity-50"
            >
              <Mail size={13} /> {lastSend ? "Resend to client" : "Email to client"}
            </button>
          )}
          {(q.status === "APPROVED" || q.status === "DRAFT") && <Action onClick={() => transition("SENT")} busy={busy}>Mark sent (no email)</Action>}
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
      {/* Revise sits IN the banner, next to the sentence telling you to use it.
          Previously the advice was here and the button was in the bar above. */}
      {locked && (
        <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-amber-700">
          <span>
            This quotation is locked — every field below is read-only so the
            client cannot see it change after we sent it.
          </span>
          <button
            onClick={() => void revise()}
            disabled={busy}
            className="rounded-lg border border-amber-400 px-2 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-50 disabled:opacity-50"
          >
            Revise to edit
          </button>
        </p>
      )}

      {/* Send status + history */}
      {!isNew && (lastSend || viewedAt || decision) && (
        <div className="mt-3 rounded-xl border border-stone-200 bg-white p-3 text-xs dark:border-stone-800 dark:bg-stone-900">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {lastSend && (
              <span className="font-semibold text-stone-700 dark:text-stone-200">
                Sent {fmtWhen(lastSend.createdAt)} to {lastSend.toAddress}
              </span>
            )}
            {opened && <span className="text-stone-500">Email opened {fmtWhen(opened)}</span>}
            <span className={viewedAt ? "flex items-center gap-1 font-semibold text-green-700" : "flex items-center gap-1 text-stone-400"}>
              <Eye size={12} /> {viewedAt ? `Quotation viewed ${fmtWhen(viewedAt)}` : "Not viewed yet"}
            </span>
            {sends.length > 1 && <span className="text-stone-400">· {sends.length} sends</span>}
          </div>
          {decision && (
            <p className={`mt-1.5 text-xs font-bold ${decision.status === "ACCEPTED" ? "text-green-700" : "text-stone-600"}`}>
              {decision.status === "ACCEPTED" ? "Accepted" : "Declined"} by the client
              {decision.by ? ` — ${decision.by}` : ""}
              {decision.at ? ` on ${fmtWhen(decision.at)}` : ""}
              {decision.note ? ` · “${decision.note}”` : ""}
            </p>
          )}
          {clientUrl && (
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-400">
              <span>Client link:</span>
              <a href={clientUrl} target="_blank" rel="noopener noreferrer" className="break-all font-mono text-orange-700 hover:underline">{clientUrl}</a>
            </p>
          )}
          {sends.length > 1 && (
            <ul className="mt-2 space-y-0.5 border-t border-stone-100 pt-2 text-[11px] text-stone-400 dark:border-stone-800">
              {sends.slice(1).map((s) => (
                <li key={s.id}>
                  {fmtWhen(s.createdAt)} · {s.toAddress}
                  {s.userName ? ` · ${s.userName}` : ""}
                  {s.attachments.length > 0 && ` · ${s.attachments.length} file(s)`}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Compose */}
      {composeOpen && (
        <div className="mt-3 rounded-xl border border-orange-200 bg-[#FFF9F5] p-4 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="font-display text-sm font-bold">Email this quotation</h2>
          <p className="mt-0.5 text-[11px] text-stone-500">
            The client gets a private link to a read-only copy of this quotation
            — they never need an account, and you will see when they open it.
          </p>
          <div className="mt-3 space-y-2">
            <Field label="To"><input value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} /></Field>
            <Field label="Subject"><input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} /></Field>
            <Field label="Message"><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={7} className={inputCls} /></Field>
            {files.length > 0 && (
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  Also attach
                </label>
                <ul className="space-y-1">
                  {files.map((f) => (
                    <li key={f.id}>
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-stone-700 dark:text-stone-200">
                        <input
                          type="checkbox"
                          checked={picked.includes(f.id)}
                          onChange={() => setPicked((p) => p.includes(f.id) ? p.filter((x) => x !== f.id) : [...p, f.id])}
                          className="accent-orange-600"
                        />
                        <Paperclip size={11} className="text-stone-400" />
                        <span className="truncate">{f.originalName}</span>
                        <span className="text-[10px] text-stone-400">{fmtSize(f.size)}</span>
                      </label>
                    </li>
                  ))}
                </ul>
                {selected.length > 0 && (
                  <p className={`mt-1 text-[11px] ${overSize ? "text-red-500" : "text-stone-400"}`}>
                    {fmtSize(totalBytes)} of {fmtSize(MAX_TOTAL_BYTES)}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button onClick={() => void sendToClient()} disabled={busy || overSize} className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50">
              <Mail size={14} /> {busy ? "Sending…" : lastSend ? "Resend" : "Send"}
            </button>
            <button onClick={() => setComposeOpen(false)} disabled={busy} className="text-xs font-semibold text-stone-500 hover:text-stone-800">
              Cancel
            </button>
            {msg && <span className="text-xs font-semibold text-stone-600">{msg}</span>}
          </div>
        </div>
      )}

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
            <Field label="Title" full>
              {locked && !q.title ? <NotSet /> : (
                <input value={q.title} disabled={locked} onChange={(e) => set("title", e.target.value)} placeholder={locked ? "" : "e.g. SEO + PPC retainer — Q3"} className={inputCls} />
              )}
            </Field>
            <Field label="Currency"><input value={q.currency} disabled={locked} onChange={(e) => set("currency", e.target.value.toUpperCase().slice(0, 4))} className={inputCls} /></Field>
            <Field label="Tax mode">
              <select value={q.taxMode} disabled={locked} onChange={(e) => set("taxMode", e.target.value as TaxModeKey)} className={inputCls}>
                {TAX_MODES.map((m) => <option key={m} value={m}>{TAX_MODE_LABEL[m]}</option>)}
              </select>
            </Field>
            <Field label="Tax rate %"><input type="number" min={0} max={100} value={q.taxRatePct} disabled={locked || q.taxMode === "NONE"} onChange={(e) => set("taxRatePct", Number(e.target.value))} className={inputCls} /></Field>
            <Field label="Overall discount %"><input type="number" min={0} max={100} value={q.discountPct} disabled={locked} onChange={(e) => set("discountPct", Number(e.target.value))} className={inputCls} /></Field>
            <Field label="Notes / terms" full>
              {locked && !q.notes ? <NotSet /> : (
                <textarea value={q.notes} disabled={locked} onChange={(e) => set("notes", e.target.value)} rows={2} className={inputCls} placeholder={locked ? "" : "Payment terms, scope notes…"} />
              )}
            </Field>
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

/**
 * A locked, empty optional field.
 *
 * This exists because of a real report: a Title typed on a locked quotation
 * never appeared, and the owner reasonably concluded it had failed to store.
 * It had never been entered — the input was disabled — but a greyed empty box
 * still showing its placeholder ("e.g. SEO + PPC retainer — Q3") is visually
 * indistinguishable from an editable empty one, so "I can't type here" read as
 * "my data was lost". Saying "Not set" makes the difference obvious.
 */
function NotSet() {
  return (
    <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-1.5 text-sm italic text-stone-400 dark:border-stone-700 dark:bg-stone-800">
      Not set
    </p>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between text-stone-600 dark:text-stone-300"><span>{label}</span><span className="tabular-nums">{value}</span></div>;
}
