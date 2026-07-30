"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { withBase } from "@/lib/base-path";
import {
  LEAD_SOURCES,
  PIPELINE_STATUSES,
  PRIORITY_STYLE,
  SOURCE_LABEL,
  STATUS_LABEL,
  sourceLabel,
  type LeadStatusKey,
} from "@/lib/crm";

type Assignee = { id: string; name: string };
type Lead = {
  id: string;
  name: string;
  company: string | null;
  status: string;
  priority: string;
  score: number | null;
  source: string;
  assignedTo: { id: string; name: string } | null;
};

const inputCls =
  "rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

export default function LeadsKanban({ assignees }: { assignees: Assignee[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [source, setSource] = useState("ALL");
  const [assignee, setAssignee] = useState("ALL");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams({ view: "board" });
    if (q) sp.set("q", q);
    if (source !== "ALL") sp.set("source", source);
    if (assignee !== "ALL") sp.set("assignedTo", assignee);
    try {
      const res = await fetch(withBase(`/api/leads?${sp.toString()}`));
      const json = await res.json();
      if (json.ok) setLeads(json.leads);
    } catch {
      /* transient */
    } finally {
      setLoading(false);
    }
  }, [q, source, assignee]);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(load, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load]);

  async function moveTo(id: string, status: LeadStatusKey) {
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.status === status) return;
    // Optimistic move.
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      const res = await fetch(withBase(`/api/leads/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) await load();
    } catch {
      await load();
    }
  }

  const onFilter = (setter: (v: string) => void) => (v: string) => setter(v);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => onFilter(setQ)(e.target.value)} placeholder="Search…" className={`${inputCls} min-w-48 flex-1`} />
        <select value={source} onChange={(e) => onFilter(setSource)(e.target.value)} className={inputCls} aria-label="Source">
          <option value="ALL">All sources</option>
          {LEAD_SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
        </select>
        <select value={assignee} onChange={(e) => onFilter(setAssignee)(e.target.value)} className={inputCls} aria-label="Assignee">
          <option value="ALL">Anyone</option>
          <option value="unassigned">Unassigned</option>
          {assignees.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <span className="text-xs text-stone-400">{loading ? "Loading…" : `${leads.length} in pipeline`}</span>
      </div>

      <div className="mt-3 flex gap-3 overflow-x-auto pb-3">
        {PIPELINE_STATUSES.map((col) => {
          const items = leads.filter((l) => l.status === col);
          return (
            <div
              key={col}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col); }}
              onDragLeave={() => setOverCol((c) => (c === col ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                setOverCol(null);
                const id = e.dataTransfer.getData("text/plain");
                if (id) void moveTo(id, col);
              }}
              className={`flex w-64 shrink-0 flex-col rounded-2xl border p-2.5 transition-colors ${
                overCol === col
                  ? "border-orange-400 bg-orange-50/60 dark:bg-stone-800/60"
                  : "border-stone-200 bg-stone-50/60 dark:border-stone-800 dark:bg-stone-900/40"
              }`}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">{STATUS_LABEL[col]}</span>
                <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold text-stone-600 dark:bg-stone-800 dark:text-stone-300">{items.length}</span>
              </div>
              <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto">
                {items.length === 0 && <p className="px-1 py-6 text-center text-[11px] text-stone-300">—</p>}
                {items.map((l) => (
                  <div
                    key={l.id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData("text/plain", l.id); e.dataTransfer.effectAllowed = "move"; setDragId(l.id); }}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => router.push(`/admin/leads/${l.id}`)}
                    className={`cursor-grab rounded-xl border border-stone-200 bg-white p-2.5 shadow-sm transition-opacity active:cursor-grabbing dark:border-stone-700 dark:bg-stone-900 ${dragId === l.id ? "opacity-40" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-tight text-stone-900 dark:text-stone-100">{l.name}</p>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${PRIORITY_STYLE[l.priority as keyof typeof PRIORITY_STYLE] ?? ""}`}>{l.priority.charAt(0)}</span>
                    </div>
                    {l.company && <p className="truncate text-xs text-stone-500">{l.company}</p>}
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px]">
                      <span className="truncate text-stone-500">{sourceLabel(l.source)}</span>
                      <span className="truncate text-stone-500">{l.assignedTo ? l.assignedTo.name : <span className="text-stone-300">Unassigned</span>}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-1 text-[11px] text-stone-400">Drag a card between columns to change its stage. Click a card to open the lead.</p>
    </div>
  );
}
