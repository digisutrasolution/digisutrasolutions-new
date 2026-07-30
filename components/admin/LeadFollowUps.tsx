"use client";

import { useState } from "react";
import { CalendarClock, Check, Plus, X } from "lucide-react";
import { withBase } from "@/lib/base-path";
import {
  DUE_LABEL,
  DUE_STYLE,
  FOLLOWUP_TYPES,
  dueBucket,
  followUpTypeLabel,
} from "@/lib/crm";

export type FollowUp = {
  id: string;
  type: string;
  title: string;
  notes: string | null;
  status: string;
  dueAt: string;
  completedAt: string | null;
  owner: { id: string; name: string } | null;
};

type Assignee = { id: string; name: string };

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

/** Default the datetime-local picker to tomorrow 10:00 in local time. */
function defaultDue(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const fmtDue = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export default function LeadFollowUps({
  leadId,
  followUps,
  assignees,
  onChanged,
}: {
  leadId: string;
  followUps: FollowUp[];
  assignees: Assignee[];
  onChanged: () => Promise<void> | void;
}) {
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState("call");
  const [title, setTitle] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [dueAt, setDueAt] = useState(defaultDue());

  const pending = followUps
    .filter((f) => f.status === "PENDING")
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const closed = followUps.filter((f) => f.status !== "PENDING");

  async function create() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(withBase(`/api/leads/${leadId}/followups`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          dueAt: new Date(dueAt).toISOString(),
          ownerId: ownerId || undefined,
        }),
      });
      if (res.ok) {
        setTitle("");
        setAdding(false);
        setDueAt(defaultDue());
        await onChanged();
      }
    } finally {
      setBusy(false);
    }
  }

  async function update(id: string, body: Record<string, unknown>) {
    setBusy(true);
    try {
      await fetch(withBase(`/api/followups/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 font-display text-sm font-bold">
          <CalendarClock size={15} className="text-orange-500" /> Follow-ups
        </h2>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline"
        >
          {adding ? <X size={12} /> : <Plus size={12} />} {adding ? "Cancel" : "Schedule"}
        </button>
      </div>

      {adding && (
        <div className="mt-3 space-y-2 rounded-xl border border-stone-200 bg-stone-50/60 p-3 dark:border-stone-800 dark:bg-stone-950/40">
          <div className="flex gap-2">
            <select value={type} onChange={(e) => setType(e.target.value)} className={`${inputCls} w-32`}>
              {FOLLOWUP_TYPES.map((t) => (
                <option key={t} value={t}>{followUpTypeLabel(t)}</option>
              ))}
            </select>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void create(); }}
              placeholder="What's the next touch?"
              className={inputCls}
              autoFocus
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className={`${inputCls} w-52`}
            />
            <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={`${inputCls} w-44`} aria-label="Owner">
              <option value="">Owner: lead assignee</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <button
              onClick={() => void create()}
              disabled={busy || !title.trim()}
              className="rounded-lg bg-orange-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-500 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Schedule"}
            </button>
          </div>
        </div>
      )}

      <ul className="mt-3 space-y-2">
        {pending.length === 0 && !adding && (
          <li className="text-xs text-stone-400">No follow-ups scheduled.</li>
        )}
        {pending.map((f) => {
          const bucket = dueBucket(f.dueAt);
          return (
            <li key={f.id} className="flex items-start gap-2 rounded-xl border border-stone-200 p-2.5 dark:border-stone-800">
              <button
                onClick={() => void update(f.id, { status: "DONE" })}
                disabled={busy}
                title="Mark done"
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-stone-300 text-transparent hover:border-green-500 hover:text-green-600 dark:border-stone-600"
              >
                <Check size={12} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-800 dark:text-stone-100">
                  <span className="text-stone-400">{followUpTypeLabel(f.type)} · </span>
                  {f.title}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
                  <span className={`rounded-full px-1.5 py-0.5 font-semibold ${DUE_STYLE[bucket]}`}>{DUE_LABEL[bucket]}</span>
                  {fmtDue(f.dueAt)}
                  {f.owner && <span>· {f.owner.name}</span>}
                </p>
              </div>
              <button
                onClick={() => void update(f.id, { status: "CANCELLED" })}
                disabled={busy}
                title="Cancel"
                className="mt-0.5 text-stone-300 hover:text-red-500"
              >
                <X size={14} />
              </button>
            </li>
          );
        })}
      </ul>

      {closed.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            History ({closed.length})
          </summary>
          <ul className="mt-2 space-y-1.5">
            {closed.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-2 text-xs text-stone-500">
                <span className="truncate">
                  {f.status === "DONE" ? "✓" : "✕"} {followUpTypeLabel(f.type)} · {f.title}
                </span>
                <span className="shrink-0 text-[11px] text-stone-400">{fmtDue(f.dueAt)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
