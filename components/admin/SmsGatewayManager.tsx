"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, CircleAlert, MessageSquare, PlayCircle, Save } from "lucide-react";
import { withBase } from "@/lib/base-path";
import type { SmsGatewayConfig } from "@/lib/sms-config";

const inputCls =
  "rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
const label = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500";

export default function SmsGatewayManager() {
  const [config, setConfig] = useState<SmsGatewayConfig | null>(null);
  const [saved, setSaved] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");
  const [test, setTest] = useState<{ to: string; busy?: boolean; ok?: boolean; msg?: string }>({ to: "" });

  const load = useCallback(async () => {
    const res = await fetch(withBase("/api/settings/sms"));
    const json = await res.json();
    if (json.ok) { setConfig(json.config); setSaved(JSON.stringify(json.config)); setReady(json.ready); }
  }, []);
  useEffect(() => { const t = setTimeout(() => void load(), 0); return () => clearTimeout(t); }, [load]);

  if (!config) return <p className="text-xs text-stone-400">Loading…</p>;
  const c = config;
  const dirty = JSON.stringify(config) !== saved;
  const setHttp = (patch: Partial<SmsGatewayConfig["http"]>) => setConfig((p) => (p ? { ...p, http: { ...p.http, ...patch } } : p));
  const setSmpp = (patch: Partial<SmsGatewayConfig["smpp"]>) => setConfig((p) => (p ? { ...p, smpp: { ...p.smpp, ...patch } } : p));
  const setTransport = (t: "http" | "smpp") => setConfig((p) => (p ? { ...p, transport: t } : p));
  const num = (v: string, f: number) => (Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : f);

  async function save() {
    setBusy(true); setFlash("");
    try {
      const res = await fetch(withBase("/api/settings/sms"), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config }) });
      const json = await res.json();
      if (json.ok) { setConfig(json.config); setSaved(JSON.stringify(json.config)); setReady(json.ready); setFlash("Saved."); }
      else setFlash(json.error ?? "Save failed.");
    } finally { setBusy(false); }
  }

  async function sendTest() {
    if (!test.to.trim()) { setTest((t) => ({ ...t, msg: "Enter a number.", ok: false })); return; }
    setTest((t) => ({ ...t, busy: true, msg: undefined }));
    try {
      const res = await fetch(withBase("/api/settings/sms/test"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: test.to.trim() }) });
      const json = await res.json();
      setTest((t) => ({ ...t, busy: false, ok: json.ok, msg: json.ok ? "Sent — check the phone." : json.reason ?? "Failed." }));
    } catch { setTest((t) => ({ ...t, busy: false, ok: false, msg: "Request failed." })); }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-bold"><MessageSquare size={16} className="text-sky-600" /> SMS gateway</p>
          {ready ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-950 dark:text-green-300"><Check size={10} /> ready</span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-1.5 py-0.5 text-[11px] font-semibold text-stone-500 dark:bg-stone-800"><CircleAlert size={10} /> not configured</span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-stone-400">Your own SMS platform — shared by lead verification (OTP) and lead messaging.</p>

        <div className="mt-3">
          <p className={label}>Transport</p>
          <div className="flex gap-2">
            {(["http", "smpp"] as const).map((tr) => (
              <button key={tr} onClick={() => setTransport(tr)} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${c.transport === tr ? "border-transparent bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" : "border-stone-300 text-stone-600 hover:border-orange-400 dark:border-stone-700 dark:text-stone-300"}`}>
                {tr === "http" ? "HTTP API" : "SMPP"}
              </button>
            ))}
          </div>
        </div>

        {c.transport === "http" ? (
          <div className="mt-3 space-y-3">
            <div>
              <label className={label}>Send URL template</label>
              <input value={c.http.url} onChange={(e) => setHttp({ url: e.target.value })} placeholder="https://sms.yourgw.com/send?user={user}&pass={password}&to={to}&from={sender}&text={text}&dlt={dlt}" className={`${inputCls} w-full`} />
              <p className="mt-1 text-[11px] text-stone-400">
                Placeholders: <code>{"{to} {text} {otp} {sender} {dlt} {user} {password}"}</code>. Keep credentials out of here —
                set <code>SMS_HTTP_USER</code> / <code>SMS_HTTP_PASSWORD</code> in .env and reference them as <code>{"{user}"}</code> / <code>{"{password}"}</code>.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div>
                <label className={label}>Method</label>
                <select value={c.http.method} onChange={(e) => setHttp({ method: e.target.value === "POST" ? "POST" : "GET" })} className={inputCls}>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>
              <div>
                <label className={label}>Sender ID</label>
                <input value={c.http.senderId} onChange={(e) => setHttp({ senderId: e.target.value })} placeholder="DIGSUT" className={`${inputCls} w-32`} />
              </div>
              <div>
                <label className={label}>DLT template id</label>
                <input value={c.http.dltTemplateId} onChange={(e) => setHttp({ dltTemplateId: e.target.value })} className={`${inputCls} w-44`} />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              SMPP delivery isn&rsquo;t wired yet (Phase 2). Pre-fill the bind here; use HTTP to go live now.
            </div>
            <div className="flex flex-wrap gap-3">
              <div><label className={label}>Host</label><input value={c.smpp.host} onChange={(e) => setSmpp({ host: e.target.value })} placeholder="smpp.yourgw.com" className={`${inputCls} w-48`} /></div>
              <div><label className={label}>Port</label><input type="number" value={c.smpp.port} onChange={(e) => setSmpp({ port: num(e.target.value, 2775) })} className={`${inputCls} w-24`} /></div>
              <div><label className={label}>System ID</label><input value={c.smpp.systemId} onChange={(e) => setSmpp({ systemId: e.target.value })} className={`${inputCls} w-40`} /></div>
              <div>
                <label className={label}>Bind</label>
                <select value={c.smpp.bindType} onChange={(e) => setSmpp({ bindType: e.target.value === "transmitter" ? "transmitter" : "transceiver" })} className={inputCls}>
                  <option value="transceiver">transceiver</option>
                  <option value="transmitter">transmitter</option>
                </select>
              </div>
              <div><label className={label}>Sender ID</label><input value={c.smpp.senderId} onChange={(e) => setSmpp({ senderId: e.target.value })} className={`${inputCls} w-32`} /></div>
              <div><label className={label}>DLT template id</label><input value={c.smpp.dltTemplateId} onChange={(e) => setSmpp({ dltTemplateId: e.target.value })} className={`${inputCls} w-44`} /></div>
            </div>
            <p className="text-[11px] text-stone-400">SMPP password → <code>SMS_SMPP_PASSWORD</code> in .env.</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <p className={label}>Send a test SMS</p>
        <div className="flex flex-wrap items-end gap-2">
          <input value={test.to} onChange={(e) => setTest((t) => ({ ...t, to: e.target.value }))} placeholder="+9198…" className={`${inputCls} min-w-52 flex-1`} />
          <button onClick={() => void sendTest()} disabled={test.busy} className="flex items-center gap-1 rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:border-orange-400 hover:text-orange-600 disabled:opacity-50 dark:border-stone-700 dark:text-stone-300">
            <PlayCircle size={13} /> {test.busy ? "Sending…" : "Send test"}
          </button>
        </div>
        {test.msg && <p className={`mt-2 text-xs font-semibold ${test.ok ? "text-green-600" : "text-red-500"}`}>{test.msg}</p>}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => void save()} disabled={busy || !dirty} className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50">
          <Save size={15} /> {busy ? "Saving…" : "Save"}
        </button>
        {dirty && !flash && <span className="text-xs font-semibold text-amber-600">Unsaved changes</span>}
        {flash && <span className="flex items-center gap-1 text-xs font-semibold text-green-600"><Check size={12} /> {flash}</span>}
      </div>
    </div>
  );
}
