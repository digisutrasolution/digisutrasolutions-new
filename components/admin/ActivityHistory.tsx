"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { withBase } from "@/lib/base-path";
import AdminPagination from "@/components/admin/AdminPagination";
import { ACTIVITY_TYPES, activityLabel, activityStyle } from "@/lib/crm";

type Assignee = { id: string; name: string };
type Activity = {
  id: string; type: string; message: string; userName: string | null;
  createdAt: string; lead: { id: string; name: string } | null;
};

const inputCls =
  "rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

export default function ActivityHistory({ assignees }: { assignees: Assignee[] }) {
  const [rows, setRows] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("ALL");
  const [userId, setUserId] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const params = useCallback(() => {
    const sp = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (q) sp.set("q", q);
    if (type !== "ALL") sp.set("type", type);
    if (userId !== "ALL") sp.set("userId", userId);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    return sp;
  }, [page, pageSize, q, type, userId, from, to]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(withBase(`/api/lead-activity?${params().toString()}`));
      const json = await res.json();
      if (json.ok) { setRows(json.activities); setTotal(json.total); setPages(json.pages); }
    } finally { setLoading(false); }
  }, [params]);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(load, 250);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [load]);

  const onFilter = (setter: (v: string) => void) => (v: string) => { setter(v); setPage(1); };

  // Group rows by calendar day for a readable feed.
  const groups: { day: string; items: Activity[] }[] = [];
  for (const a of rows) {
    const day = new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(a);
    else groups.push({ day, items: [a] });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => onFilter(setQ)(e.target.value)} placeholder="Search message, user or lead…" className={`${inputCls} min-w-52 flex-1`} />
        <select value={type} onChange={(e) => onFilter(setType)(e.target.value)} className={inputCls} aria-label="Type">
          <option value="ALL">All types</option>
          {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{activityLabel(t)}</option>)}
        </select>
        <select value={userId} onChange={(e) => onFilter(setUserId)(e.target.value)} className={inputCls} aria-label="User">
          <option value="ALL">Anyone</option>
          <option value="system">System</option>
          {assignees.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <label className="flex items-center gap-1 text-xs text-stone-400">From <input type="date" value={from} onChange={(e) => onFilter(setFrom)(e.target.value)} className={inputCls} /></label>
        <label className="flex items-center gap-1 text-xs text-stone-400">To <input type="date" value={to} onChange={(e) => onFilter(setTo)(e.target.value)} className={inputCls} /></label>
      </div>

      <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
        {loading ? "Loading…" : `${total.toLocaleString("en-IN")} event${total === 1 ? "" : "s"}`}
      </p>

      <div className="mt-2 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
        {total === 0 && !loading && <p className="py-8 text-center text-sm text-stone-400">No activity matches these filters.</p>}
        {groups.map((g) => (
          <div key={g.day} className="mb-5 last:mb-0">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-400">{g.day}</p>
            <ol className="space-y-3 border-l border-stone-200 pl-4 dark:border-stone-800">
              {g.items.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-orange-500" aria-hidden />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activityStyle(a.type)}`}>{activityLabel(a.type)}</span>
                    <span className="text-sm text-stone-700 dark:text-stone-200">{a.message}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-stone-400">
                    {a.lead && <><Link href={`/admin/leads/${a.lead.id}`} className="hover:text-orange-600">{a.lead.name}</Link>{" · "}</>}
                    {a.userName ?? "System"}{" · "}
                    {new Date(a.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <AdminPagination page={page} pages={pages} total={total} pageSize={pageSize} label="events" onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />
    </div>
  );
}
