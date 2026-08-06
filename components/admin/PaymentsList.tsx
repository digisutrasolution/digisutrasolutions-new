"use client";

import { withBase } from "@/lib/base-path";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, ReceiptText, Search, Trash2, X } from "lucide-react";
import AdminPagination from "@/components/admin/AdminPagination";
import {
  CURRENCIES,
  METHOD_LABEL,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_STYLE,
  STATUS_TRANSITIONS,
  formatMoney,
  type PaymentStatusKey,
} from "@/lib/payment-records";

type Row = {
  id: string;
  reference: string;
  clientName: string;
  clientCompany: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  amount: number;
  currency: string;
  method: string;
  status: PaymentStatusKey;
  txnRef: string | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  recordedByName: string | null;
  lead: { id: string; name: string } | null;
  quotation: { id: string; number: string; version: number } | null;
};

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
const fieldCls =
  "rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
const labelCls = "mb-1 block text-xs font-semibold";

const EMPTY = {
  clientName: "",
  clientCompany: "",
  clientEmail: "",
  clientPhone: "",
  amount: "",
  currency: "INR",
  method: "bank",
  status: "PENDING" as PaymentStatusKey,
  txnRef: "",
  paidAt: "",
  notes: "",
};

export default function PaymentsList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [totals, setTotals] = useState<Record<string, { collected: number; pending: number }>>({});
  const [total, setTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Editor
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (method) params.set("method", method);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    try {
      const res = await fetch(withBase(`/api/payments?${params}`));
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not load payments.");
        return;
      }
      setRows(json.payments);
      setTotal(json.total);
      setGrandTotal(json.grandTotal);
      setTotals(json.totals ?? {});
      setError(null);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, q, status, method, from, to]);

  // Debounced so typing in search does not fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY });
    setShowForm(true);
  }

  function openEdit(r: Row) {
    setEditing(r);
    setForm({
      clientName: r.clientName,
      clientCompany: r.clientCompany ?? "",
      clientEmail: r.clientEmail ?? "",
      clientPhone: r.clientPhone ?? "",
      amount: String(r.amount),
      currency: r.currency,
      method: r.method,
      status: r.status,
      txnRef: r.txnRef ?? "",
      paidAt: r.paidAt ? r.paidAt.slice(0, 10) : "",
      notes: r.notes ?? "",
    });
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const amount = Number.parseFloat(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter an amount greater than zero.");
      setBusy(false);
      return;
    }
    const payload: Record<string, unknown> = {
      clientName: form.clientName.trim(),
      clientCompany: form.clientCompany.trim() || null,
      clientEmail: form.clientEmail.trim() || null,
      clientPhone: form.clientPhone.trim() || null,
      amount,
      currency: form.currency,
      method: form.method,
      status: form.status,
      txnRef: form.txnRef.trim() || null,
      paidAt: form.paidAt ? new Date(`${form.paidAt}T00:00:00.000Z`).toISOString() : null,
      notes: form.notes.trim() || null,
    };
    try {
      const res = await fetch(
        withBase(editing ? `/api/payments/${editing.id}` : "/api/payments"),
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not save the payment.");
        return;
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(r: Row) {
    if (!window.confirm(`Delete ${r.reference}? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(withBase(`/api/payments/${r.id}`), { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not delete the payment.");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  const filtered = Boolean(q || status || method || from || to);
  const currencyLines = Object.entries(totals);
  // A status may only move to what the ledger allows, plus where it already is.
  const allowedStatuses = editing
    ? [editing.status, ...STATUS_TRANSITIONS[editing.status]]
    : PAYMENT_STATUSES;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={openCreate}
          className="flex cursor-pointer items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-500"
        >
          <Plus size={15} aria-hidden /> Record payment
        </button>
        {error && (
          <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      {/* Money summary — one line per currency, because adding INR to USD
          would be a meaningless number. */}
      {currencyLines.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {currencyLines.map(([cur, t]) => (
            <div
              key={cur}
              className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
                {cur} {filtered ? "· filtered" : "· all time"}
              </p>
              <p className="font-display mt-1 text-xl font-extrabold text-green-700 dark:text-green-400">
                {formatMoney(t.collected, cur)}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                collected · {formatMoney(t.pending, cur)} pending
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {/* minmax(0,1fr) + min-w-0: a grid track defaults to min-width:auto, so
          the search input's intrinsic width would push the row wider than the
          panel and scroll the whole page sideways (same trap as the mega
          panel). The date/select tracks stay auto-sized. */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]">
        <div className="relative min-w-0">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            aria-hidden
          />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search reference, client, email or transaction id…"
            aria-label="Search payments"
            className={`${inputCls} pl-9`}
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by status"
          className={fieldCls}
        >
          <option value="">All statuses</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PAYMENT_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          value={method}
          onChange={(e) => {
            setMethod(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by method"
          className={fieldCls}
        >
          <option value="">All methods</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(1);
          }}
          aria-label="From date"
          className={fieldCls}
        />
        <input
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setPage(1);
          }}
          aria-label="To date"
          className={fieldCls}
        />
      </div>
      {filtered && (
        <button
          onClick={() => {
            setQ("");
            setStatus("");
            setMethod("");
            setFrom("");
            setTo("");
            setPage(1);
          }}
          className="mt-2 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-orange-700 hover:underline"
        >
          <X size={12} aria-hidden /> Clear filters ({total} of {grandTotal})
        </button>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500 dark:border-stone-800 dark:text-stone-400">
              <th className="px-5 py-3 font-semibold">Reference</th>
              <th className="px-5 py-3 font-semibold">Client</th>
              <th className="px-5 py-3 text-right font-semibold">Amount</th>
              <th className="px-5 py-3 font-semibold">Method</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-stone-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-stone-500">
                  {grandTotal === 0
                    ? "No payments recorded yet — add the first one above."
                    : "No payments match these filters."}
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-stone-100 last:border-0 dark:border-stone-800"
                >
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs font-semibold">{r.reference}</span>
                    {r.txnRef && (
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        {r.txnRef}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-medium">{r.clientName}</span>
                    {r.clientCompany && (
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        {r.clientCompany}
                      </p>
                    )}
                    <div className="mt-0.5 flex flex-wrap gap-2 text-[11px]">
                      {r.lead && (
                        <Link
                          href={`/admin/leads/${r.lead.id}`}
                          className="text-orange-700 hover:underline"
                        >
                          Lead: {r.lead.name}
                        </Link>
                      )}
                      {r.quotation && (
                        <Link
                          href={`/admin/quotations/${r.quotation.id}`}
                          className="flex items-center gap-1 text-orange-700 hover:underline"
                        >
                          <ReceiptText size={11} aria-hidden />
                          {r.quotation.number} · v{r.quotation.version}
                        </Link>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums">
                    {formatMoney(r.amount, r.currency)}
                  </td>
                  <td className="px-5 py-3 text-xs">{METHOD_LABEL[r.method] ?? r.method}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${PAYMENT_STATUS_STYLE[r.status]}`}
                    >
                      {PAYMENT_STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-stone-500 dark:text-stone-400">
                    {r.paidAt
                      ? `Paid ${new Date(r.paidAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}`
                      : new Date(r.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    {r.recordedByName ? ` · ${r.recordedByName}` : ""}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(r)}
                        aria-label={`Edit ${r.reference}`}
                        title="Edit"
                        className="cursor-pointer rounded-lg p-2 text-stone-500 transition-colors hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-stone-800"
                      >
                        <Pencil size={15} aria-hidden />
                      </button>
                      <button
                        onClick={() => void remove(r)}
                        disabled={busy}
                        aria-label={`Delete ${r.reference}`}
                        title="Delete — settled payments cannot be deleted"
                        className="cursor-pointer rounded-lg p-2 text-stone-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-stone-800"
                      >
                        <Trash2 size={15} aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <AdminPagination
        page={page}
        pages={Math.max(1, Math.ceil(total / pageSize))}
        total={total}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={(n) => {
          setPageSize(n);
          setPage(1);
        }}
        label="payments"
      />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-900/50 p-4 sm:p-8">
          <form
            onSubmit={save}
            className="w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-6 shadow-xl dark:border-stone-800 dark:bg-stone-900"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-extrabold tracking-tight">
                {editing ? `Edit ${editing.reference}` : "Record a payment"}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close"
                className="cursor-pointer rounded-lg p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X size={16} aria-hidden />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="pay-client" className={labelCls}>Client name *</label>
                <input
                  id="pay-client"
                  required
                  minLength={2}
                  value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="pay-company" className={labelCls}>Company</label>
                <input
                  id="pay-company"
                  value={form.clientCompany}
                  onChange={(e) => setForm({ ...form, clientCompany: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="pay-email" className={labelCls}>Email</label>
                <input
                  id="pay-email"
                  type="email"
                  value={form.clientEmail}
                  onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="pay-phone" className={labelCls}>Phone</label>
                <input
                  id="pay-phone"
                  value={form.clientPhone}
                  onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="pay-amount" className={labelCls}>Amount *</label>
                <input
                  id="pay-amount"
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="pay-currency" className={labelCls}>Currency</label>
                <select
                  id="pay-currency"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className={inputCls}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="pay-method" className={labelCls}>Method</label>
                <select
                  id="pay-method"
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                  className={inputCls}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="pay-status" className={labelCls}>Status</label>
                <select
                  id="pay-status"
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as PaymentStatusKey })
                  }
                  className={inputCls}
                >
                  {allowedStatuses.map((s) => (
                    <option key={s} value={s}>{PAYMENT_STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="pay-txn" className={labelCls}>Transaction / UTR / cheque no.</label>
                <input
                  id="pay-txn"
                  value={form.txnRef}
                  onChange={(e) => setForm({ ...form, txnRef: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="pay-date" className={labelCls}>Date received</label>
                <input
                  id="pay-date"
                  type="date"
                  value={form.paidAt}
                  onChange={(e) => setForm({ ...form, paidAt: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="pay-notes" className={labelCls}>Notes</label>
                <textarea
                  id="pay-notes"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            {editing && STATUS_TRANSITIONS[editing.status].length === 0 && (
              <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
                This payment is settled — its status can no longer change.
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="cursor-pointer rounded-full border border-stone-300 px-5 py-2 text-sm font-semibold text-stone-700 transition-colors hover:border-orange-500 dark:border-stone-700 dark:text-stone-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="cursor-pointer rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-500 disabled:opacity-60"
              >
                {busy ? "Saving…" : editing ? "Save changes" : "Record payment"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
