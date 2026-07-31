"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Send, Trash2, Webhook, X } from "lucide-react";
import { withBase } from "@/lib/base-path";
import { EVENT_LABEL, WEBHOOK_EVENTS, type WebhookEvent } from "@/lib/integrations";

type Hook = {
  id: string; name: string; url: string; events: string[]; secret: string; active: boolean;
  lastStatus: number | null; lastError: string | null; lastDeliveredAt: string | null;
};

const inputCls =
  "rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

export default function WebhooksManager() {
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<WebhookEvent[]>(["lead.created"]);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(withBase("/api/webhooks"));
    const json = await res.json();
    if (json.ok) setHooks(json.webhooks);
  }, []);
  useEffect(() => { const t = setTimeout(() => void load(), 0); return () => clearTimeout(t); }, [load]);

  const toggleEvent = (e: WebhookEvent) => setEvents((cur) => cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]);

  async function create() {
    if (!name.trim() || !url.trim() || !events.length) return;
    setBusy(true);
    try {
      const res = await fetch(withBase("/api/webhooks"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), url: url.trim(), events }) });
      const json = await res.json();
      if (json.ok) { setName(""); setUrl(""); setAdding(false); await load(); }
      else alert(json.error ?? "Failed.");
    } finally { setBusy(false); }
  }
  async function toggle(h: Hook) {
    await fetch(withBase(`/api/webhooks/${h.id}`), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !h.active }) });
    await load();
  }
  async function test(h: Hook) {
    setTesting(h.id);
    try {
      await fetch(withBase(`/api/webhooks/${h.id}/test`), { method: "POST" });
      await load();
    } finally { setTesting(null); }
  }
  async function remove(h: Hook) {
    if (!window.confirm(`Delete webhook "${h.name}"?`)) return;
    await fetch(withBase(`/api/webhooks/${h.id}`), { method: "DELETE" });
    await load();
  }

  const statusBadge = (h: Hook) => {
    if (h.lastStatus == null && !h.lastError) return null;
    const ok = h.lastStatus != null && h.lastStatus < 400;
    return <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${ok ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"}`}>{h.lastStatus ? `HTTP ${h.lastStatus}` : "Failed"}</span>;
  };

  return (
    <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 font-display text-sm font-bold"><Webhook size={15} className="text-orange-500" /> Webhooks</h2>
        <button onClick={() => setAdding((v) => !v)} className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:underline">
          {adding ? <X size={12} /> : <Plus size={12} />} {adding ? "Cancel" : "New webhook"}
        </button>
      </div>
      <p className="mt-1 text-xs text-stone-400">We POST the event as JSON with an <code>X-DigiSutra-Signature</code> header (HMAC-SHA256 of the body, keyed on the webhook secret).</p>

      {adding && (
        <div className="mt-3 space-y-2 rounded-xl border border-stone-200 bg-stone-50/60 p-3 dark:border-stone-800 dark:bg-stone-950/40">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. n8n lead workflow)" className={`${inputCls} w-full`} />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-endpoint.example.com/hook" className={`${inputCls} w-full`} />
          <div className="flex flex-wrap gap-2">
            {WEBHOOK_EVENTS.map((e) => (
              <button key={e} type="button" onClick={() => toggleEvent(e)} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${events.includes(e) ? "border-orange-500 bg-orange-500 text-white" : "border-stone-300 text-stone-500 dark:border-stone-700"}`}>{EVENT_LABEL[e]}</button>
            ))}
          </div>
          <button onClick={() => void create()} disabled={busy || !name.trim() || !url.trim() || !events.length} className="rounded-lg bg-orange-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-500 disabled:opacity-50">{busy ? "Creating…" : "Create webhook"}</button>
        </div>
      )}

      <ul className="mt-3 space-y-2">
        {hooks.length === 0 && <li className="text-xs text-stone-400">No webhooks yet.</li>}
        {hooks.map((h) => (
          <li key={h.id} className="rounded-xl border border-stone-200 p-3 dark:border-stone-800">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-semibold">{h.name} {statusBadge(h)}</p>
                <p className="truncate font-mono text-[11px] text-stone-500">{h.url}</p>
                <p className="mt-0.5 text-[11px] text-stone-400">{h.events.map((e) => EVENT_LABEL[e as WebhookEvent] ?? e).join(" · ")}</p>
                <details className="mt-1">
                  <summary className="cursor-pointer text-[11px] text-stone-400">Signing secret</summary>
                  <code className="mt-1 block overflow-x-auto rounded bg-stone-100 px-2 py-1 font-mono text-[11px] dark:bg-stone-800">{h.secret}</code>
                </details>
              </div>
              <button onClick={() => void toggle(h)} title={h.active ? "Disable" : "Enable"} className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${h.active ? "bg-orange-500" : "bg-stone-300 dark:bg-stone-700"}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${h.active ? "left-4" : "left-0.5"}`} />
              </button>
              <button onClick={() => void test(h)} disabled={testing === h.id} title="Send test ping" className="rounded-lg border border-stone-300 p-2 text-stone-400 hover:border-orange-400 hover:text-orange-600 disabled:opacity-50 dark:border-stone-700"><Send size={13} /></button>
              <button onClick={() => void remove(h)} className="rounded-lg border border-stone-300 p-2 text-stone-400 hover:border-red-400 hover:text-red-600 dark:border-stone-700" aria-label="Delete"><Trash2 size={13} /></button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
