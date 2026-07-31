"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Plus } from "lucide-react";
import { withBase } from "@/lib/base-path";
import AdminPagination from "@/components/admin/AdminPagination";
import {
  QUOTATION_STATUSES,
  QUOTE_STATUS_STYLE,
  formatMoney,
  quoteRef,
  quoteStatusLabel,
} from "@/lib/quotations";

type Quote = {
  id: string;
  number: string;
  version: number;
  clientName: string;
  clientCompany: string | null;
  title: string;
  total: number;
  currency: string;
  status: string;
  validUntil: string | null;
  createdByName: string | null;
  createdAt: string;
};

const inputCls =
  "rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

export default function QuotationsList() {
  const router = useRouter();
  const [rows, setRows] = useState<Quote[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status !== "ALL") sp.set("status", status);
    try {
      const res = await fetch(withBase(`/api/quotations?${sp.toString()}`));
      const json = await res.json();
      if (json.ok) { setRows(json.quotations); setPage(1); }
    } catch {
      /* transient */
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(load, 200);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [load]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search number, client, title…" className={`${inputCls} min-w-56 flex-1`} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls} aria-label="Status">
          <option value="ALL">All statuses</option>
          {QUOTATION_STATUSES.map((s) => <option key={s} value={s}>{quoteStatusLabel(s)}</option>)}
        </select>
        <Link href="/admin/quotations/new" className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-orange-500">
          <Plus size={13} /> New quotation
        </Link>
      </div>

      <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
        {loading ? "Loading…" : `${rows.length} quotation${rows.length === 1 ? "" : "s"}`}
      </p>

      <div className="mt-2 overflow-x-auto rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-left text-xs uppercase tracking-wide text-stone-400 dark:border-stone-800">
              <th className="px-4 py-2.5">Number</th>
              <th className="px-4 py-2.5">Client</th>
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5 text-right">Total</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Created</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-stone-500">No quotations yet.</td></tr>
            )}
            {rows.slice((page - 1) * pageSize, page * pageSize).map((r) => (
              <tr key={r.id} onClick={() => router.push(`/admin/quotations/${r.id}`)} className="cursor-pointer border-b border-stone-50 transition-colors last:border-0 hover:bg-orange-50/40 dark:border-stone-800/60 dark:hover:bg-stone-800/40">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold">{quoteRef(r.number, r.version)}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-stone-900 dark:text-stone-100">{r.clientName}</div>
                  {r.clientCompany && <div className="text-xs text-stone-500">{r.clientCompany}</div>}
                </td>
                <td className="px-4 py-3 text-xs text-stone-500">{r.title || "—"}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatMoney(r.total, r.currency)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${QUOTE_STATUS_STYLE[r.status as keyof typeof QUOTE_STATUS_STYLE]}`}>{quoteStatusLabel(r.status)}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-500 dark:text-stone-400">
                  <div>{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                  <div className="text-[11px] text-stone-400">{new Date(r.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</div>
                </td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => router.push(`/admin/quotations/${r.id}`)} title="View / edit" className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2 py-1 text-[11px] font-semibold text-stone-600 hover:border-orange-400 hover:text-orange-600 dark:border-stone-700 dark:text-stone-300">
                    <Eye size={13} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminPagination
        page={page}
        pages={Math.max(1, Math.ceil(rows.length / pageSize))}
        total={rows.length}
        pageSize={pageSize}
        label="quotations"
        onPage={setPage}
        onPageSize={(n) => { setPageSize(n); setPage(1); }}
      />
    </div>
  );
}
