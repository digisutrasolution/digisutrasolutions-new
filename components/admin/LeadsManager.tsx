"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Eye, MessageCircle, Plus, ShieldCheck } from "lucide-react";
import { withBase } from "@/lib/base-path";
import AdminPagination from "@/components/admin/AdminPagination";
import {
  LEAD_PRIORITIES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  PRIORITY_LABEL,
  PRIORITY_STYLE,
  SOURCE_LABEL,
  STATUS_LABEL,
  STATUS_STYLE,
  sourceLabel,
} from "@/lib/crm";
import {
  BAND_LABEL,
  BAND_STYLE,
  SCORE_BANDS,
  bandOf,
  type ScoringConfig,
} from "@/lib/scoring";

import AssigneePicker, { type Assignee } from "@/components/admin/AssigneePicker";

type Lead = {
  id: string;
  name: string;
  company: string | null;
  whatsapp: string;
  email: string | null;
  source: string;
  status: string;
  priority: string;
  score: number | null;
  verified: boolean;
  createdAt: string;
  assignedTo: { id: string; name: string } | null;
};

const inputCls =
  "rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs outline-none transition-colors focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

export default function LeadsManager({
  assignees,
  scoringConfig,
}: {
  assignees: Assignee[];
  scoringConfig: ScoringConfig;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [source, setSource] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [assignee, setAssignee] = useState("ALL");
  const [band, setBand] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAssignee, setBulkAssignee] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  const params = useCallback(() => {
    const sp = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (q) sp.set("q", q);
    if (status !== "ALL") sp.set("status", status);
    if (source !== "ALL") sp.set("source", source);
    if (priority !== "ALL") sp.set("priority", priority);
    if (assignee !== "ALL") sp.set("assignedTo", assignee);
    if (band !== "ALL") sp.set("band", band);
    return sp;
  }, [page, pageSize, q, status, source, priority, assignee, band]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(withBase(`/api/leads?${params().toString()}`));
      const json = await res.json();
      if (json.ok) {
        setLeads(json.leads);
        setTotal(json.total);
        setPages(json.pages);
      }
    } catch {
      /* transient */
    } finally {
      setLoading(false);
    }
  }, [params]);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(load, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load]);

  const onFilter = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  // ---- bulk selection / assignment ----
  const toggleSel = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allOnPage = leads.length > 0 && leads.every((l) => selected.has(l.id));
  const toggleAll = () =>
    setSelected((s) => {
      const n = new Set(s);
      if (allOnPage) leads.forEach((l) => n.delete(l.id));
      else leads.forEach((l) => n.add(l.id));
      return n;
    });
  const clearSel = () => setSelected(new Set());

  async function bulkAssign(assignedToId: string | null) {
    const ids = [...selected];
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      await fetch(withBase("/api/leads/bulk"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, assignedToId }),
      });
      clearSel();
      await load();
    } finally {
      setBulkBusy(false);
    }
  }

  // Round-robin: spread the selected leads evenly across active users.
  async function roundRobin() {
    const ids = [...selected];
    if (!ids.length || assignees.length === 0) return;
    setBulkBusy(true);
    try {
      const buckets: Record<string, string[]> = {};
      ids.forEach((id, i) => {
        const uid = assignees[i % assignees.length].id;
        (buckets[uid] ??= []).push(id);
      });
      await Promise.all(
        Object.entries(buckets).map(([uid, bIds]) =>
          fetch(withBase("/api/leads/bulk"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: bIds, assignedToId: uid }),
          }),
        ),
      );
      clearSel();
      await load();
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2">
        <input
          value={q}
          onChange={(e) => onFilter(setQ)(e.target.value)}
          placeholder="Search name, company, email, phone…"
          className={`${inputCls} min-w-56 flex-1`}
        />
        <select value={status} onChange={(e) => onFilter(setStatus)(e.target.value)} className={inputCls} aria-label="Status">
          <option value="ALL">All statuses</option>
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <select value={source} onChange={(e) => onFilter(setSource)(e.target.value)} className={inputCls} aria-label="Source">
          <option value="ALL">All sources</option>
          {LEAD_SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
        </select>
        <select value={priority} onChange={(e) => onFilter(setPriority)(e.target.value)} className={inputCls} aria-label="Priority">
          <option value="ALL">All priorities</option>
          {LEAD_PRIORITIES.map((s) => <option key={s} value={s}>{PRIORITY_LABEL[s]}</option>)}
        </select>
        <select value={band} onChange={(e) => onFilter(setBand)(e.target.value)} className={inputCls} aria-label="Score band">
          <option value="ALL">All scores</option>
          {SCORE_BANDS.map((b) => <option key={b} value={b}>{BAND_LABEL[b]}</option>)}
        </select>
        <AssigneePicker
          assignees={assignees}
          value={assignee}
          onChange={onFilter(setAssignee)}
          leading={[{ value: "ALL", label: "Anyone" }, { value: "unassigned", label: "Unassigned" }]}
          label="Assignee"
          className="w-44"
        />
        <button
          onClick={() => setShowAdd(true)}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-orange-500"
        >
          <Plus size={13} /> Add lead
        </button>
        <a
          href={withBase(`/api/leads?${params().toString()}&format=csv`)}
          className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:border-orange-400 dark:border-stone-700 dark:text-stone-300"
        >
          <Download size={13} /> CSV
        </a>
      </div>

      <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
        {loading ? "Loading…" : `${total.toLocaleString("en-IN")} lead${total === 1 ? "" : "s"}`}
      </p>

      {selected.size > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs dark:border-orange-900/60 dark:bg-orange-950/30">
          <span className="font-semibold text-orange-800 dark:text-orange-300">{selected.size} selected</span>
          <AssigneePicker
            assignees={assignees}
            value={bulkAssignee}
            onChange={setBulkAssignee}
            leading={[{ value: "__unassign", label: "Unassign" }]}
            placeholder="Assign to…"
            label="Bulk assign to"
            className="w-52"
          />
          <button
            onClick={() => void bulkAssign(bulkAssignee === "__unassign" ? null : bulkAssignee)}
            disabled={bulkBusy || !bulkAssignee}
            className="cursor-pointer rounded-lg bg-orange-600 px-3 py-1.5 font-semibold text-white hover:bg-orange-500 disabled:opacity-50"
          >
            Assign
          </button>
          <button
            onClick={() => void roundRobin()}
            disabled={bulkBusy || assignees.length === 0}
            title="Spread the selected leads evenly across all team members"
            className="cursor-pointer rounded-lg border border-stone-300 px-3 py-1.5 font-semibold text-stone-700 hover:border-orange-400 hover:text-orange-700 disabled:opacity-50 dark:border-stone-700 dark:text-stone-300"
          >
            Round-robin
          </button>
          <button onClick={clearSel} className="ml-auto cursor-pointer font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200">
            Clear
          </button>
        </div>
      )}

      <div className="mt-2 overflow-x-auto rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-left text-xs uppercase tracking-wide text-stone-400 dark:border-stone-800">
              <th className="w-9 px-3 py-2.5">
                <input type="checkbox" checked={allOnPage} onChange={toggleAll} aria-label="Select all" className="h-4 w-4 accent-orange-600" />
              </th>
              <th className="px-4 py-2.5">Lead</th>
              <th className="px-4 py-2.5">Source</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Priority</th>
              <th className="px-4 py-2.5">Score</th>
              <th className="px-4 py-2.5">Assigned</th>
              <th className="px-4 py-2.5">Created</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && !loading && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-stone-500">
                  No leads match these filters.
                </td>
              </tr>
            )}
            {leads.map((l) => (
              <tr
                key={l.id}
                onClick={() => router.push(`/admin/leads/${l.id}`)}
                className={`cursor-pointer border-b border-stone-50 transition-colors last:border-0 hover:bg-orange-50/40 dark:border-stone-800/60 dark:hover:bg-stone-800/40 ${selected.has(l.id) ? "bg-orange-50/60 dark:bg-stone-800/50" : ""}`}
              >
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggleSel(l.id)} aria-label={`Select ${l.name}`} className="h-4 w-4 accent-orange-600" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 font-semibold text-stone-900 dark:text-stone-100">
                    {l.name}
                    {l.verified && <ShieldCheck size={13} className="text-emerald-600" aria-label="verified" />}
                  </div>
                  <div className="text-xs text-stone-500">
                    {l.company ? `${l.company} · ` : ""}{l.whatsapp}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-stone-500">{sourceLabel(l.source)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLE[l.status as keyof typeof STATUS_STYLE] ?? ""}`}>
                    {STATUS_LABEL[l.status as keyof typeof STATUS_LABEL] ?? l.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${PRIORITY_STYLE[l.priority as keyof typeof PRIORITY_STYLE] ?? ""}`}>
                    {PRIORITY_LABEL[l.priority as keyof typeof PRIORITY_LABEL] ?? l.priority}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  {l.score == null ? (
                    <span className="text-stone-400">—</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="font-semibold tabular-nums text-stone-600 dark:text-stone-300">{l.score}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${BAND_STYLE[bandOf(l.score, scoringConfig)]}`}>{BAND_LABEL[bandOf(l.score, scoringConfig)]}</span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-stone-600 dark:text-stone-300">{l.assignedTo?.name ?? <span className="text-stone-400">Unassigned</span>}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-500 dark:text-stone-400">
                  <div>{new Date(l.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                  <div className="text-[11px] text-stone-400">{new Date(l.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</div>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => router.push(`/admin/leads/${l.id}`)} title="View / edit" className="flex items-center gap-1 rounded-lg border border-stone-200 px-2 py-1 text-[11px] font-semibold text-stone-600 hover:border-orange-400 hover:text-orange-600 dark:border-stone-700 dark:text-stone-300">
                      <Eye size={13} /> View
                    </button>
                    <a href={`https://wa.me/${l.whatsapp.replace(/[^\d]/g, "")}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="rounded-lg border border-stone-200 p-1.5 text-[#25D366] hover:border-[#25D366] dark:border-stone-700">
                      <MessageCircle size={13} />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminPagination
        page={page}
        pages={pages}
        total={total}
        pageSize={pageSize}
        label="leads"
        onPage={setPage}
        onPageSize={(n) => { setPageSize(n); setPage(1); }}
      />

      {showAdd && (
        <AddLeadModal
          assignees={assignees}
          onClose={() => setShowAdd(false)}
          onCreated={(id) => router.push(`/admin/leads/${id}`)}
        />
      )}
    </div>
  );
}

function AddLeadModal({
  assignees,
  onClose,
  onCreated,
}: {
  assignees: Assignee[];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [f, setF] = useState({
    name: "",
    whatsapp: "",
    email: "",
    company: "",
    website: "",
    country: "",
    city: "",
    budget: "",
    message: "",
    source: "MANUAL",
    priority: "MEDIUM",
    assignedToId: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(withBase("/api/leads/manual"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, assignedToId: f.assignedToId || undefined, email: f.email || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setErr(json.error ?? "Could not create lead.");
        return;
      }
      onCreated(json.id);
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-xl dark:border-stone-700 dark:bg-stone-900"
      >
        <h2 className="font-display text-lg font-bold">Add lead</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Name *"><input value={f.name} onChange={(e) => set("name", e.target.value)} className={`${inputCls} w-full`} /></Field>
          <Field label="WhatsApp *"><input value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} className={`${inputCls} w-full`} placeholder="+91…" /></Field>
          <Field label="Email"><input value={f.email} onChange={(e) => set("email", e.target.value)} className={`${inputCls} w-full`} /></Field>
          <Field label="Company"><input value={f.company} onChange={(e) => set("company", e.target.value)} className={`${inputCls} w-full`} /></Field>
          <Field label="Website"><input value={f.website} onChange={(e) => set("website", e.target.value)} className={`${inputCls} w-full`} /></Field>
          <Field label="Budget"><input value={f.budget} onChange={(e) => set("budget", e.target.value)} className={`${inputCls} w-full`} /></Field>
          <Field label="Country"><input value={f.country} onChange={(e) => set("country", e.target.value)} className={`${inputCls} w-full`} /></Field>
          <Field label="City"><input value={f.city} onChange={(e) => set("city", e.target.value)} className={`${inputCls} w-full`} /></Field>
          <Field label="Source">
            <select value={f.source} onChange={(e) => set("source", e.target.value)} className={`${inputCls} w-full`}>
              {LEAD_SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select value={f.priority} onChange={(e) => set("priority", e.target.value)} className={`${inputCls} w-full`}>
              {LEAD_PRIORITIES.map((s) => <option key={s} value={s}>{PRIORITY_LABEL[s]}</option>)}
            </select>
          </Field>
          <Field label="Assign to" full>
            <AssigneePicker
              assignees={assignees}
              value={f.assignedToId}
              onChange={(v) => set("assignedToId", v)}
              leading={[{ value: "", label: "Unassigned" }]}
              placeholder="Unassigned"
              label="Assign to"
            />
          </Field>
          <Field label="Message / notes" full>
            <textarea value={f.message} onChange={(e) => set("message", e.target.value)} rows={2} className={`${inputCls} w-full`} />
          </Field>
        </div>
        {err && <p className="mt-3 text-xs font-medium text-red-600">{err}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600 dark:border-stone-700 dark:text-stone-300">Cancel</button>
          <button onClick={() => void submit()} disabled={busy || !f.name || !f.whatsapp} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50">
            {busy ? "Creating…" : "Create lead"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">{label}</label>
      {children}
    </div>
  );
}
