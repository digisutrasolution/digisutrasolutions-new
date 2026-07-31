"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, MessageCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { withBase } from "@/lib/base-path";
import { CHANNEL_LABEL, COMM_CHANNELS, PLACEHOLDERS, type CommChannel } from "@/lib/comms";

type Template = {
  id: string;
  name: string;
  channel: CommChannel;
  subject: string;
  body: string;
  active: boolean;
};

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

export default function CommTemplates() {
  const [rows, setRows] = useState<Template[]>([]);
  const [editing, setEditing] = useState<Template | null>(null);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(withBase("/api/comm-templates"));
      const json = await res.json();
      if (json.ok) setRows(json.templates);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  async function remove(t: Template) {
    if (!window.confirm(`Delete "${t.name}"?`)) return;
    await fetch(withBase(`/api/comm-templates/${t.id}`), { method: "DELETE" });
    await load();
  }
  async function toggle(t: Template) {
    await fetch(withBase(`/api/comm-templates/${t.id}`), {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !t.active }),
    });
    await load();
  }

  return (
    <div className="space-y-4">
      <button onClick={() => { setAdding(true); setEditing(null); }} className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-orange-500">
        <Plus size={15} /> New template
      </button>

      {(adding || editing) && (
        <TemplateEditor
          initial={editing}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSaved={async () => { setAdding(false); setEditing(null); await load(); }}
        />
      )}

      {loading && <p className="text-xs text-stone-400">Loading…</p>}
      {!loading && rows.length === 0 && !adding && (
        <p className="rounded-2xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-400 dark:border-stone-700">No templates yet.</p>
      )}

      <ul className="space-y-2">
        {rows.map((t) => (
          <li key={t.id} className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.channel === "EMAIL" ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"}`}>
              {t.channel === "EMAIL" ? <Mail size={15} /> : <MessageCircle size={15} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-semibold text-stone-900 dark:text-stone-100">
                {t.name}
                {!t.active && <span className="rounded-full bg-stone-200 px-1.5 py-0.5 text-[10px] font-bold text-stone-500 dark:bg-stone-700">Off</span>}
              </p>
              {t.channel === "EMAIL" && t.subject && <p className="truncate text-xs text-stone-500">Subject: {t.subject}</p>}
              <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">{t.body}</p>
            </div>
            <button onClick={() => void toggle(t)} title={t.active ? "Disable" : "Enable"} className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${t.active ? "bg-orange-500" : "bg-stone-300 dark:bg-stone-700"}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${t.active ? "left-4" : "left-0.5"}`} />
            </button>
            <button onClick={() => { setEditing(t); setAdding(false); }} className="rounded-lg border border-stone-300 p-2 text-stone-400 hover:border-orange-400 hover:text-orange-600 dark:border-stone-700" aria-label="Edit"><Pencil size={14} /></button>
            <button onClick={() => void remove(t)} className="rounded-lg border border-stone-300 p-2 text-stone-400 hover:border-red-400 hover:text-red-600 dark:border-stone-700" aria-label="Delete"><Trash2 size={14} /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TemplateEditor({ initial, onClose, onSaved }: { initial: Template | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [channel, setChannel] = useState<CommChannel>(initial?.channel ?? "EMAIL");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    if (!name.trim() || !body.trim()) { setErr("Name and body are required."); return; }
    setBusy(true); setErr("");
    try {
      const res = await fetch(
        withBase(initial ? `/api/comm-templates/${initial.id}` : "/api/comm-templates"),
        { method: initial ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, channel, subject, body, active }) },
      );
      const json = await res.json();
      if (json.ok) onSaved();
      else setErr(json.error ?? "Save failed.");
    } finally { setBusy(false); }
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50/60 p-5 dark:border-stone-800 dark:bg-stone-950/40">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm font-bold">{initial ? "Edit template" : "New template"}</h2>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-700"><X size={16} /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. Intro + audit offer" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">Channel</label>
          <select value={channel} onChange={(e) => setChannel(e.target.value as CommChannel)} className={inputCls}>
            {COMM_CHANNELS.map((c) => <option key={c} value={c}>{CHANNEL_LABEL[c]}</option>)}
          </select>
        </div>
        {channel === "EMAIL" && (
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} placeholder="Quick idea for {{company}}" />
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">Message</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className={inputCls} placeholder={"Hi {{firstName}},\n\n…"} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PLACEHOLDERS.map((p) => (
              <button key={p.key} type="button" onClick={() => setBody((b) => `${b}{{${p.key}}}`)} title={p.label} className="rounded-full border border-stone-300 px-2 py-0.5 text-[10px] font-semibold text-stone-500 hover:border-orange-400 hover:text-orange-600 dark:border-stone-700">
                {`{{${p.key}}}`}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={() => void save()} disabled={busy} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50">{busy ? "Saving…" : "Save template"}</button>
        <label className="flex items-center gap-1.5 text-xs text-stone-500"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-orange-600" /> Active</label>
        {err && <span className="text-xs text-red-500">{err}</span>}
      </div>
    </div>
  );
}
