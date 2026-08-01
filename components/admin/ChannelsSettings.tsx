"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, CircleAlert, MessageSquare, PlayCircle, Save, Send } from "lucide-react";
import { withBase } from "@/lib/base-path";
import type { ChannelsConfig } from "@/lib/channels-config";

type Availability = {
  smsGateway: boolean;
  smsSend: boolean;
  telegramBot: boolean;
  telegramAlerts: boolean;
  telegramDeepLink: boolean;
};

const inputCls =
  "rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-orange-500" : "bg-stone-300 dark:bg-stone-700"}`}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? "left-4" : "left-0.5"}`} />
    </button>
  );
}

function Chip({ ok, okText, badText }: { ok: boolean; okText: string; badText: string }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-950 dark:text-green-300"><Check size={10} /> {okText}</span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-1.5 py-0.5 text-[11px] font-semibold text-stone-500 dark:bg-stone-800"><CircleAlert size={10} /> {badText}</span>
  );
}

export default function ChannelsSettings() {
  const [config, setConfig] = useState<ChannelsConfig | null>(null);
  const [saved, setSaved] = useState("");
  const [avail, setAvail] = useState<Availability>({ smsGateway: false, smsSend: false, telegramBot: false, telegramAlerts: false, telegramDeepLink: false });
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");
  const [test, setTest] = useState<{ busy?: boolean; ok?: boolean; msg?: string }>({});

  const load = useCallback(async () => {
    const res = await fetch(withBase("/api/settings/channels"));
    const json = await res.json();
    if (json.ok) { setConfig(json.config); setSaved(JSON.stringify(json.config)); setAvail(json.availability); }
  }, []);
  useEffect(() => { const t = setTimeout(() => void load(), 0); return () => clearTimeout(t); }, [load]);

  if (!config) return <p className="text-xs text-stone-400">Loading…</p>;
  const c = config;
  const dirty = JSON.stringify(config) !== saved;
  const setSms = (patch: Partial<ChannelsConfig["sms"]>) => setConfig((p) => (p ? { ...p, sms: { ...p.sms, ...patch } } : p));
  const setTg = (patch: Partial<ChannelsConfig["telegram"]>) => setConfig((p) => (p ? { ...p, telegram: { ...p.telegram, ...patch } } : p));

  async function save() {
    setBusy(true); setFlash("");
    try {
      const res = await fetch(withBase("/api/settings/channels"), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config }) });
      const json = await res.json();
      if (json.ok) { setConfig(json.config); setSaved(JSON.stringify(json.config)); setAvail(json.availability); setFlash("Saved."); }
      else setFlash(json.error ?? "Save failed.");
    } finally { setBusy(false); }
  }

  async function sendTest() {
    setTest({ busy: true });
    try {
      const res = await fetch(withBase("/api/settings/channels/test"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chatId: c.telegram.chatId }) });
      const json = await res.json();
      setTest({ ok: json.ok, msg: json.ok ? "Sent — check your Telegram chat." : json.error ?? "Failed." });
    } catch { setTest({ ok: false, msg: "Request failed." }); }
  }

  return (
    <div className="max-w-2xl space-y-4">
      {/* SMS */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-bold"><MessageSquare size={16} className="text-sky-600" /> SMS messaging</p>
          <Toggle on={c.sms.enabled} onClick={() => setSms({ enabled: !c.sms.enabled })} />
        </div>
        <p className="mt-0.5 text-[11px] text-stone-400">Send SMS to leads from the lead composer, using your own gateway.</p>
        <div className="mt-2 flex items-center gap-2">
          <Chip ok={avail.smsGateway} okText="gateway ready" badText="gateway not configured" />
        </div>
        <p className="mt-2 text-[11px] text-stone-400">
          Uses the same HTTP gateway as OTP — configure the send URL, sender ID and DLT template under{" "}
          <Link href="/admin/verification" className="text-orange-600 hover:underline">Verification → SMS</Link>. Credentials
          stay in <code>.env</code> (<code>SMS_HTTP_USER</code> / <code>SMS_HTTP_PASSWORD</code>).
        </p>
      </div>

      {/* Telegram */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <p className="flex items-center gap-2 text-sm font-bold"><Send size={16} className="text-[#229ED9]" /> Telegram</p>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Lead outreach (deep links)</p>
            <p className="text-[11px] text-stone-400">Show a Telegram composer on leads — opens t.me/@username and copies your message to paste.</p>
          </div>
          <Toggle on={c.telegram.deepLink} onClick={() => setTg({ deepLink: !c.telegram.deepLink })} />
        </div>

        <div className="mt-4 border-t border-stone-100 pt-3 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Team alerts</p>
              <p className="text-[11px] text-stone-400">Post every new lead to your team&rsquo;s Telegram chat via the bot.</p>
            </div>
            <Toggle on={c.telegram.alerts} onClick={() => setTg({ alerts: !c.telegram.alerts })} />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Chip ok={avail.telegramBot} okText="bot token detected" badText="set TELEGRAM_BOT_TOKEN in .env" />
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">Team chat id</label>
              <input value={c.telegram.chatId} onChange={(e) => setTg({ chatId: e.target.value })} placeholder="-1001234567890" className={`${inputCls} w-56`} />
            </div>
            <button onClick={() => void sendTest()} disabled={test.busy || !c.telegram.chatId} className="flex items-center gap-1 rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:border-orange-400 hover:text-orange-600 disabled:opacity-50 dark:border-stone-700 dark:text-stone-300">
              <PlayCircle size={13} /> {test.busy ? "Sending…" : "Send test"}
            </button>
            {test.msg && <span className={`text-xs font-semibold ${test.ok ? "text-green-600" : "text-red-500"}`}>{test.msg}</span>}
          </div>
          <p className="mt-2 text-[11px] text-stone-400">Add your bot to the group and use the group&rsquo;s chat id. The bot token is a secret and lives in <code>.env</code>.</p>
        </div>
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
