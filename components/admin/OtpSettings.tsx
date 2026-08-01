"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, CircleAlert, PlayCircle, Save, ShieldCheck } from "lucide-react";
import { withBase } from "@/lib/base-path";
import { OTP_CHANNEL_POLICIES, type OtpConfig } from "@/lib/otp-config";
import SettingsLayout, { RailCard, ChecklistItem } from "@/components/admin/SettingsLayout";

type Availability = { email: boolean; sms: boolean; emailReason?: string; smsReason?: string };

const inputCls =
  "rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
const label = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={on ? "On" : "Off"}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-orange-500" : "bg-stone-300 dark:bg-stone-700"}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? "left-4" : "left-0.5"}`} />
    </button>
  );
}

function Chip({ ok, okText, badText }: { ok: boolean; okText: string; badText: string }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
      <Check size={10} /> {okText}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-1.5 py-0.5 text-[11px] font-semibold text-stone-500 dark:bg-stone-800">
      <CircleAlert size={10} /> {badText}
    </span>
  );
}

export default function OtpSettings() {
  const [config, setConfig] = useState<OtpConfig | null>(null);
  const [saved, setSaved] = useState("");
  const [avail, setAvail] = useState<Availability>({ email: false, sms: false });
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");
  const [test, setTest] = useState<{ channel: "email" | "sms"; target: string; busy?: boolean; msg?: string; ok?: boolean }>({
    channel: "email",
    target: "",
  });

  const load = useCallback(async () => {
    const res = await fetch(withBase("/api/settings/otp"));
    const json = await res.json();
    if (json.ok) {
      setConfig(json.config);
      setSaved(JSON.stringify(json.config));
      setAvail(json.availability);
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  if (!config) return <p className="text-xs text-stone-400">Loading…</p>;
  const dirty = JSON.stringify(config) !== saved;
  const c = config;
  const set = (patch: Partial<OtpConfig>) => setConfig((p) => (p ? { ...p, ...patch } : p));
  const setEmail = (patch: Partial<OtpConfig["email"]>) => setConfig((p) => (p ? { ...p, email: { ...p.email, ...patch } } : p));
  const setSms = (patch: Partial<OtpConfig["sms"]>) => setConfig((p) => (p ? { ...p, sms: { ...p.sms, ...patch } } : p));
  const setHttp = (patch: Partial<OtpConfig["sms"]["http"]>) =>
    setConfig((p) => (p ? { ...p, sms: { ...p.sms, http: { ...p.sms.http, ...patch } } } : p));
  const setSmpp = (patch: Partial<OtpConfig["sms"]["smpp"]>) =>
    setConfig((p) => (p ? { ...p, sms: { ...p.sms, smpp: { ...p.sms.smpp, ...patch } } } : p));
  const num = (v: string, fallback: number) => (Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : fallback);

  async function save() {
    setBusy(true);
    setFlash("");
    try {
      const res = await fetch(withBase("/api/settings/otp"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const json = await res.json();
      if (json.ok) {
        setConfig(json.config);
        setSaved(JSON.stringify(json.config));
        setAvail(json.availability);
        setFlash("Saved.");
      } else setFlash(json.error ?? "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    if (!test.target.trim()) {
      setTest((t) => ({ ...t, msg: "Enter a recipient.", ok: false }));
      return;
    }
    setTest((t) => ({ ...t, busy: true, msg: undefined }));
    try {
      const res = await fetch(withBase("/api/settings/otp/test"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: test.channel, target: test.target.trim() }),
      });
      const json = await res.json();
      setTest((t) => ({
        ...t,
        busy: false,
        ok: json.ok,
        msg: json.ok ? `Sent to ${json.target}. Check for the code.` : json.reason ?? "Failed to send.",
      }));
    } catch {
      setTest((t) => ({ ...t, busy: false, ok: false, msg: "Request failed." }));
    }
  }

  const channelWord = c.channelPolicy === "email" ? "email" : c.channelPolicy === "sms" ? "phone" : "email or phone";
  const rail = (
    <>
      <RailCard title="What the visitor sees">
        <div className="rounded-xl border border-stone-200 bg-white p-3 text-center dark:border-stone-800 dark:bg-stone-900">
          <p className="text-xs font-bold">Verify your {channelWord}</p>
          <p className="text-[10px] text-stone-400">a {c.codeLength}-digit code is sent to your {channelWord}</p>
          <div className="mt-2 flex justify-center gap-1">
            {Array.from({ length: c.codeLength }).map((_, i) => (
              <span key={i} className="h-6 w-5 rounded-md border-[1.5px] border-stone-300 dark:border-stone-600" />
            ))}
          </div>
        </div>
        <p className="mt-2.5 text-[11px] leading-relaxed text-stone-400">{c.enabled ? "Live on your public forms now." : "Turned off — forms behave normally."}</p>
      </RailCard>
      <RailCard title="Setup checklist">
        <ChecklistItem done={c.enabled} label="Verification" hint={c.enabled ? "on" : "turn on the master switch"} />
        <ChecklistItem done={avail.email} label="Email channel" hint={avail.email ? "ready" : avail.emailReason ?? "not ready"} />
        <ChecklistItem done={avail.sms} label="SMS channel" hint={avail.sms ? "ready" : avail.smsReason ?? "not ready"} />
      </RailCard>
    </>
  );

  return (
    <SettingsLayout rail={rail}>
      {/* Master switch */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold">
            <ShieldCheck size={16} className="text-orange-600" /> Lead verification
          </p>
          <p className="mt-0.5 text-[11px] text-stone-400">
            When on, public forms ask the visitor to confirm their email/phone with a one-time code. Leads are always
            captured either way (soft) — verified ones get a badge and a score boost.
          </p>
        </div>
        <Toggle on={c.enabled} onClick={() => set({ enabled: !c.enabled })} />
      </div>

      {/* Channel policy */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <p className={label}>Channel</p>
        <div className="flex flex-wrap gap-2">
          {OTP_CHANNEL_POLICIES.map((p) => (
            <button
              key={p.id}
              onClick={() => set({ channelPolicy: p.id })}
              title={p.hint}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                c.channelPolicy === p.id
                  ? "border-transparent bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                  : "border-stone-300 text-stone-600 hover:border-orange-400 dark:border-stone-700 dark:text-stone-300"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-stone-400">
          {OTP_CHANNEL_POLICIES.find((p) => p.id === c.channelPolicy)?.hint}
        </p>
      </div>

      {/* Code rules */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <p className={label}>Code rules</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <span className="text-[11px] text-stone-400">Digits</span>
            <input type="number" min={4} max={8} value={c.codeLength} onChange={(e) => set({ codeLength: num(e.target.value, 6) })} className={`${inputCls} w-full`} />
          </div>
          <div>
            <span className="text-[11px] text-stone-400">Expiry (min)</span>
            <input type="number" min={1} max={60} value={c.ttlMinutes} onChange={(e) => set({ ttlMinutes: num(e.target.value, 10) })} className={`${inputCls} w-full`} />
          </div>
          <div>
            <span className="text-[11px] text-stone-400">Max attempts</span>
            <input type="number" min={1} max={10} value={c.maxAttempts} onChange={(e) => set({ maxAttempts: num(e.target.value, 5) })} className={`${inputCls} w-full`} />
          </div>
          <div>
            <span className="text-[11px] text-stone-400">Resend (sec)</span>
            <input type="number" min={15} max={300} value={c.resendSeconds} onChange={(e) => set({ resendSeconds: num(e.target.value, 45) })} className={`${inputCls} w-full`} />
          </div>
        </div>
      </div>

      {/* Email channel */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold">Email channel</p>
          <Toggle on={c.email.enabled} onClick={() => setEmail({ enabled: !c.email.enabled })} />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Chip ok={avail.email} okText="ready" badText={avail.emailReason ?? "not ready"} />
        </div>
        <div className="mt-3">
          <label className={label}>From name</label>
          <input value={c.email.fromName} onChange={(e) => setEmail({ fromName: e.target.value })} className={`${inputCls} w-full`} />
          <p className="mt-1 text-[11px] text-stone-400">Uses your configured SMTP (Settings → email). Secrets stay in .env.</p>
        </div>
      </div>

      {/* SMS channel */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">SMS channel</p>
          <Toggle on={c.sms.enabled} onClick={() => setSms({ enabled: !c.sms.enabled })} />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Chip ok={avail.sms} okText="ready" badText={avail.smsReason ?? "not ready"} />
        </div>

        <div className="mt-3">
          <p className={label}>Transport</p>
          <div className="flex gap-2">
            {(["http", "smpp"] as const).map((tr) => (
              <button
                key={tr}
                onClick={() => setSms({ transport: tr })}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  c.sms.transport === tr
                    ? "border-transparent bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                    : "border-stone-300 text-stone-600 hover:border-orange-400 dark:border-stone-700 dark:text-stone-300"
                }`}
              >
                {tr === "http" ? "HTTP API" : "SMPP"}
              </button>
            ))}
          </div>
        </div>

        {c.sms.transport === "http" ? (
          <div className="mt-3 space-y-3">
            <div>
              <label className={label}>Send URL template</label>
              <input
                value={c.sms.http.url}
                onChange={(e) => setHttp({ url: e.target.value })}
                placeholder="https://sms.yourgw.com/send?user={user}&pass={password}&to={to}&from={sender}&text={text}&dlt={dlt}"
                className={`${inputCls} w-full`}
              />
              <p className="mt-1 text-[11px] text-stone-400">
                Placeholders: <code>{"{to} {text} {otp} {sender} {dlt} {user} {password}"}</code>. Keep credentials out of
                here — set <code>SMS_HTTP_USER</code> / <code>SMS_HTTP_PASSWORD</code> in .env and reference them as{" "}
                <code>{"{user}"}</code> / <code>{"{password}"}</code>.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div>
                <label className={label}>Method</label>
                <select value={c.sms.http.method} onChange={(e) => setHttp({ method: e.target.value === "POST" ? "POST" : "GET" })} className={inputCls}>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>
              <div>
                <label className={label}>Sender ID</label>
                <input value={c.sms.http.senderId} onChange={(e) => setHttp({ senderId: e.target.value })} placeholder="DIGSUT" className={`${inputCls} w-32`} />
              </div>
              <div>
                <label className={label}>DLT template id</label>
                <input value={c.sms.http.dltTemplateId} onChange={(e) => setHttp({ dltTemplateId: e.target.value })} className={`${inputCls} w-44`} />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              SMPP delivery isn&rsquo;t wired yet (Phase 2). You can pre-fill the bind here; use the HTTP transport to go live now.
            </div>
            <div className="flex flex-wrap gap-3">
              <div>
                <label className={label}>Host</label>
                <input value={c.sms.smpp.host} onChange={(e) => setSmpp({ host: e.target.value })} placeholder="smpp.yourgw.com" className={`${inputCls} w-48`} />
              </div>
              <div>
                <label className={label}>Port</label>
                <input type="number" value={c.sms.smpp.port} onChange={(e) => setSmpp({ port: num(e.target.value, 2775) })} className={`${inputCls} w-24`} />
              </div>
              <div>
                <label className={label}>System ID</label>
                <input value={c.sms.smpp.systemId} onChange={(e) => setSmpp({ systemId: e.target.value })} className={`${inputCls} w-40`} />
              </div>
              <div>
                <label className={label}>Bind</label>
                <select value={c.sms.smpp.bindType} onChange={(e) => setSmpp({ bindType: e.target.value === "transmitter" ? "transmitter" : "transceiver" })} className={inputCls}>
                  <option value="transceiver">transceiver</option>
                  <option value="transmitter">transmitter</option>
                </select>
              </div>
              <div>
                <label className={label}>Sender ID</label>
                <input value={c.sms.smpp.senderId} onChange={(e) => setSmpp({ senderId: e.target.value })} className={`${inputCls} w-32`} />
              </div>
              <div>
                <label className={label}>DLT template id</label>
                <input value={c.sms.smpp.dltTemplateId} onChange={(e) => setSmpp({ dltTemplateId: e.target.value })} className={`${inputCls} w-44`} />
              </div>
            </div>
            <p className="text-[11px] text-stone-400">SMPP password → <code>SMS_SMPP_PASSWORD</code> in .env.</p>
          </div>
        )}

        <div className="mt-3">
          <label className={label}>Message text</label>
          <input value={c.smsTemplate} onChange={(e) => set({ smsTemplate: e.target.value })} className={`${inputCls} w-full`} />
          <p className="mt-1 text-[11px] text-stone-400">Use <code>{"{otp}"}</code> for the code and <code>{"{mins}"}</code> for the expiry.</p>
        </div>
      </div>

      {/* Test */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <p className={label}>Send a test code</p>
        <div className="flex flex-wrap items-end gap-2">
          <select value={test.channel} onChange={(e) => setTest((t) => ({ ...t, channel: e.target.value as "email" | "sms" }))} className={inputCls}>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
          <input
            value={test.target}
            onChange={(e) => setTest((t) => ({ ...t, target: e.target.value }))}
            placeholder={test.channel === "email" ? "you@example.com" : "+9198…"}
            className={`${inputCls} min-w-56 flex-1`}
          />
          <button onClick={() => void sendTest()} disabled={test.busy} className="flex items-center gap-1 rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:border-orange-400 hover:text-orange-600 disabled:opacity-50 dark:border-stone-700 dark:text-stone-300">
            <PlayCircle size={13} /> {test.busy ? "Sending…" : "Send test"}
          </button>
        </div>
        {test.msg && <p className={`mt-2 text-xs font-semibold ${test.ok ? "text-green-600" : "text-red-500"}`}>{test.msg}</p>}
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button onClick={() => void save()} disabled={busy || !dirty} className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50">
          <Save size={15} /> {busy ? "Saving…" : "Save"}
        </button>
        {dirty && !flash && <span className="text-xs font-semibold text-amber-600">Unsaved changes</span>}
        {flash && <span className="flex items-center gap-1 text-xs font-semibold text-green-600"><Check size={12} /> {flash}</span>}
      </div>
    </SettingsLayout>
  );
}
