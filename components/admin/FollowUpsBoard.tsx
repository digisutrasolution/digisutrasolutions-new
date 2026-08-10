"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BellRing,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  List,
} from "lucide-react";
import { withBase } from "@/lib/base-path";
import {
  DUE_LABEL,
  DUE_STYLE,
  PRIORITY_STYLE,
  dueBucket,
  followUpTypeLabel,
  type DueBucket,
} from "@/lib/crm";

import AssigneePicker, { type Assignee } from "@/components/admin/AssigneePicker";
type FollowUp = {
  id: string;
  type: string;
  title: string;
  status: string;
  dueAt: string;
  owner: { id: string; name: string } | null;
  lead: {
    id: string;
    name: string;
    company: string | null;
    whatsapp: string;
    status: string;
    priority: string;
  };
};

const inputCls =
  "rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

const localDateKey = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const fmtDue = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export default function FollowUpsBoard({
  assignees,
  currentUserId,
  canRunCron,
}: {
  assignees: Assignee[];
  currentUserId: string;
  canRunCron: boolean;
}) {
  const router = useRouter();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [items, setItems] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [scope, setScope] = useState<"mine" | "all">("all");
  const [status, setStatus] = useState("PENDING");
  const [assignee, setAssignee] = useState("ALL");
  const [q, setQ] = useState("");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [cronMsg, setCronMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (scope === "mine") sp.set("scope", "mine");
    sp.set("status", status);
    if (scope !== "mine" && assignee !== "ALL") sp.set("assignee", assignee);
    if (q) sp.set("q", q);
    try {
      const res = await fetch(withBase(`/api/followups?${sp.toString()}`));
      const json = await res.json();
      if (json.ok) setItems(json.followUps);
    } catch {
      /* transient */
    } finally {
      setLoading(false);
    }
  }, [scope, status, assignee, q]);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(load, 200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load]);

  async function complete(id: string) {
    setBusy(true);
    // Optimistic: drop it from the pending list immediately.
    setItems((xs) => xs.filter((f) => f.id !== id));
    try {
      await fetch(withBase(`/api/followups/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      });
    } finally {
      setBusy(false);
      if (status !== "PENDING") await load();
    }
  }

  async function runReminders() {
    setBusy(true);
    setCronMsg("");
    try {
      const res = await fetch(withBase(`/api/cron/followups`), { method: "POST" });
      const json = await res.json();
      if (json.ok) setCronMsg(`Reminded ${json.reminded}, escalated ${json.escalated}.`);
      else setCronMsg(json.error ?? "Failed.");
    } finally {
      setBusy(false);
    }
  }

  const buckets = useMemo(() => {
    const groups: Record<DueBucket, FollowUp[]> = { overdue: [], today: [], soon: [], later: [] };
    for (const f of items) {
      if (f.status === "PENDING") groups[dueBucket(f.dueAt)].push(f);
      else groups.later.push(f);
    }
    return groups;
  }, [items]);

  const btn = (active: boolean) =>
    `flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
      active
        ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
        : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
    }`;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full border border-stone-200 p-0.5 dark:border-stone-800">
          <button onClick={() => setView("list")} className={btn(view === "list")}><List size={13} /> List</button>
          <button onClick={() => setView("calendar")} className={btn(view === "calendar")}><CalendarDays size={13} /> Calendar</button>
        </div>
        <div className="inline-flex rounded-full border border-stone-200 p-0.5 dark:border-stone-800">
          <button onClick={() => setScope("all")} className={btn(scope === "all")}>Everyone</button>
          <button onClick={() => setScope("mine")} className={btn(scope === "mine")}>Mine</button>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls} aria-label="Status">
          <option value="PENDING">Pending</option>
          <option value="DONE">Done</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="ALL">All statuses</option>
        </select>
        {scope !== "mine" && (
          <AssigneePicker
            assignees={assignees}
            value={assignee}
            onChange={setAssignee}
            leading={[{ value: "ALL", label: "Anyone" }, { value: "unassigned", label: "Unassigned" }]}
            label="Owner"
            className="w-44"
          />
        )}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className={`${inputCls} min-w-40 flex-1`} />
        {canRunCron && (
          <button onClick={() => void runReminders()} disabled={busy} className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:border-orange-400 hover:text-orange-600 disabled:opacity-50 dark:border-stone-700 dark:text-stone-300">
            <BellRing size={13} /> Run reminders now
          </button>
        )}
      </div>
      {cronMsg && <p className="mt-2 text-xs text-orange-600">{cronMsg}</p>}
      <p className="mt-2 text-xs text-stone-400">{loading ? "Loading…" : `${items.length} follow-up${items.length === 1 ? "" : "s"}`}</p>

      {view === "list" ? (
        <ListView buckets={buckets} onComplete={complete} onOpen={(id) => router.push(`/admin/leads/${id}`)} busy={busy} currentUserId={currentUserId} />
      ) : (
        <CalendarView items={items} month={month} setMonth={setMonth} onOpen={(id) => router.push(`/admin/leads/${id}`)} />
      )}
    </div>
  );
}

/* ---------------- List view ---------------- */

const BUCKET_ORDER: DueBucket[] = ["overdue", "today", "soon", "later"];

function ListView({
  buckets,
  onComplete,
  onOpen,
  busy,
  currentUserId,
}: {
  buckets: Record<DueBucket, FollowUp[]>;
  onComplete: (id: string) => void;
  onOpen: (leadId: string) => void;
  busy: boolean;
  currentUserId: string;
}) {
  const total = BUCKET_ORDER.reduce((n, b) => n + buckets[b].length, 0);
  if (total === 0) {
    return <p className="mt-8 rounded-2xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-400 dark:border-stone-700">Nothing here — no follow-ups match.</p>;
  }
  return (
    <div className="mt-4 space-y-5">
      {BUCKET_ORDER.map((b) => {
        const list = buckets[b];
        if (list.length === 0) return null;
        return (
          <div key={b}>
            <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-stone-500">
              <span className={`rounded-full px-2 py-0.5 ${DUE_STYLE[b]}`}>{DUE_LABEL[b]}</span>
              <span className="text-stone-400">{list.length}</span>
            </h3>
            <ul className="space-y-2">
              {list.map((f) => (
                <li key={f.id} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
                  {f.status === "PENDING" && (
                    <button
                      onClick={() => onComplete(f.id)}
                      disabled={busy}
                      title="Mark done"
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-stone-300 text-transparent hover:border-green-500 hover:text-green-600 dark:border-stone-600"
                    >
                      <Check size={13} />
                    </button>
                  )}
                  <button onClick={() => onOpen(f.lead.id)} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-semibold text-stone-800 dark:text-stone-100">
                      <span className="text-stone-400">{followUpTypeLabel(f.type)} · </span>
                      {f.title}
                    </p>
                    <p className="truncate text-xs text-stone-500">
                      {f.lead.name}{f.lead.company ? ` · ${f.lead.company}` : ""} · {fmtDue(f.dueAt)}
                    </p>
                  </button>
                  <span className={`hidden shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold sm:inline ${PRIORITY_STYLE[f.lead.priority as keyof typeof PRIORITY_STYLE] ?? ""}`}>
                    {f.lead.priority.charAt(0)}
                  </span>
                  <span className="hidden shrink-0 text-[11px] text-stone-400 sm:block">
                    {f.owner ? (f.owner.id === currentUserId ? "You" : f.owner.name) : "Unassigned"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Calendar view ---------------- */

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function CalendarView({
  items,
  month,
  setMonth,
  onOpen,
}: {
  items: FollowUp[];
  month: Date;
  setMonth: (d: Date) => void;
  onOpen: (leadId: string) => void;
}) {
  const byDay = useMemo(() => {
    const m = new Map<string, FollowUp[]>();
    for (const f of items) {
      const k = localDateKey(f.dueAt);
      (m.get(k) ?? m.set(k, []).get(k)!).push(f);
    }
    return m;
  }, [items]);

  // Build a Monday-first grid covering the month.
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const startOffset = (first.getDay() + 6) % 7; // Mon = 0
    const start = new Date(first);
    start.setDate(first.getDate() - startOffset);
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [month]);

  const todayKey = localDateKey(new Date().toISOString());
  const pad = (n: number) => String(n).padStart(2, "0");
  const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  return (
    <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold">
          {month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-lg border border-stone-200 p-1.5 text-stone-500 hover:text-orange-600 dark:border-stone-700" aria-label="Previous month"><ChevronLeft size={15} /></button>
          <button onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-500 hover:text-orange-600 dark:border-stone-700">Today</button>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-lg border border-stone-200 p-1.5 text-stone-500 hover:text-orange-600 dark:border-stone-700" aria-label="Next month"><ChevronRight size={15} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-stone-200 text-center dark:bg-stone-800">
        {WEEKDAYS.map((w) => (
          <div key={w} className="bg-stone-50 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400 dark:bg-stone-950">{w}</div>
        ))}
        {cells.map((d) => {
          const k = keyOf(d);
          const dayItems = byDay.get(k) ?? [];
          const inMonth = d.getMonth() === month.getMonth();
          const isToday = k === todayKey;
          return (
            <div key={k} className={`min-h-[92px] bg-white p-1.5 text-left align-top dark:bg-stone-900 ${inMonth ? "" : "opacity-40"}`}>
              <div className={`mb-1 text-[11px] font-semibold ${isToday ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-white" : "text-stone-400"}`}>{d.getDate()}</div>
              <div className="space-y-1">
                {dayItems.slice(0, 3).map((f) => {
                  const bucket = f.status === "PENDING" ? dueBucket(f.dueAt) : "later";
                  return (
                    <button
                      key={f.id}
                      onClick={() => onOpen(f.lead.id)}
                      title={`${fmtTime(f.dueAt)} · ${f.title} — ${f.lead.name}`}
                      className={`block w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium ${f.status !== "PENDING" ? "bg-stone-100 text-stone-400 line-through dark:bg-stone-800" : DUE_STYLE[bucket]}`}
                    >
                      {fmtTime(f.dueAt)} {f.lead.name}
                    </button>
                  );
                })}
                {dayItems.length > 3 && <p className="px-1 text-[10px] text-stone-400">+{dayItems.length - 3} more</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
