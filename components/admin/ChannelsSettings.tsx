"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, CircleAlert, Mail, MessageCircle, MessageSquare, PlayCircle, Save, Send } from "lucide-react";
import { withBase } from "@/lib/base-path";
import type { ChannelsConfig } from "@/lib/channels-config";
import SettingsLayout, { RailCard, ChecklistItem } from "@/components/admin/SettingsLayout";

type Availability = {
  emailProvider: boolean;
  emailSend: boolean;
  whatsappSend: boolean;
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
  const [avail, setAvail] = useState<Availability>({ emailProvider: false, emailSend: false, whatsappSend: false, smsGateway: false, smsSend: false, telegramBot: false, telegramAlerts: false, telegramDeepLink: false });
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
  const setEmail = (patch: Partial<ChannelsConfig["email"]>) => setConfig((p) => (p ? { ...p, email: { ...p.email, ...patch } } : p));
  const setWa = (patch: Partial<ChannelsConfig["whatsapp"]>) => setConfig((p) => (p ? { ...p, whatsapp: { ...p.whatsapp, ...patch } } : p));
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

  // Live preview / status — recomputed from the current (unsaved) toggles.
  const emailOn = c.email.enabled && avail.emailProvider;
  const waOn = c.whatsapp.enabled;
  const smsOn = c.sms.enabled && avail.smsGateway;
  const tgOn = c.telegram.deepLink;
  const liveCount = [emailOn, waOn, smsOn, tgOn].filter(Boolean).length;
  const previewTab = (on: boolean, label: string) => (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${on ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900" : "border border-stone-200 text-stone-400 opacity-60 dark:border-stone-700"}`}>{label}</span>
  );

  const rail = (
    <>
      <RailCard title="Lead composer preview">
        <div className="flex flex-wrap gap-1.5">
          {previewTab(emailOn, "Email")}
          {previewTab(waOn, "WhatsApp")}
          {previewTab(smsOn, "SMS")}
          {previewTab(tgOn, "Telegram")}
        </div>
        <p className="mt-2.5 text-[11px] leading-relaxed text-stone-400">Exactly what your team sees on a lead — dimmed channels are off or not configured.</p>
      </RailCard>
      <RailCard title="Setup checklist">
        <ChecklistItem done={avail.emailProvider} label="Email" hint={avail.emailProvider ? "provider ready" : "configure SMTP in Settings"} />
        <ChecklistItem done={c.whatsapp.enabled} label="WhatsApp" hint={c.whatsapp.enabled ? "no setup needed" : "turned off"} />
        <ChecklistItem done={avail.smsGateway} label="SMS" hint={avail.smsGateway ? "gateway ready" : "add gateway URL in Verification"} />
        <ChecklistItem done={avail.telegramBot} label="Telegram" hint={avail.telegramBot ? "bot token detected" : "set TELEGRAM_BOT_TOKEN"} />
      </RailCard>
      <RailCard title="Status">
        <p className="text-2xl font-extrabold tracking-tight">{liveCount}<span className="text-sm font-semibold text-stone-400"> / 4 live</span></p>
        <p className="mt-0.5 text-[11px] text-stone-400">channels your team can use right now</p>
      </RailCard>
    </>
  );

  return (
    <SettingsLayout rail={rail}>
      {/* Email */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-bold"><Mail size={16} className="text-blue-600" /> Email messaging</p>
          <Toggle on={c.email.enabled} onClick={() => setEmail({ enabled: !c.email.enabled })} />
        </div>
        <p className="mt-0.5 text-[11px] text-stone-400">Show the Email tab in the lead composer.</p>
        <div className="mt-2 flex items-center gap-2">
          <Chip ok={avail.emailProvider} okText="provider ready" badText="configure SMTP in Settings" />
        </div>
        <p className="mt-2 text-[11px] text-stone-400">
          Only affects the lead composer — OTP codes, form auto-replies and new-lead notifications always send. Set up the
          sender under <Link href="/admin/settings" className="text-orange-600 hover:underline">Settings → email</Link>.
        </p>
      </div>

      {/* WhatsApp */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-bold"><MessageCircle size={16} className="text-green-600" /> WhatsApp</p>
          <Toggle on={c.whatsapp.enabled} onClick={() => setWa({ enabled: !c.whatsapp.enabled })} />
        </div>
        <p className="mt-0.5 text-[11px] text-stone-400">Show the WhatsApp tab — opens wa.me with your message pre-filled.</p>
        <div className="mt-2 flex items-center gap-2">
          <Chip ok={avail.whatsappSend} okText="ready" badText="turned off" />
        </div>
        <p className="mt-2 text-[11px] text-stone-400">No gateway or secret needed — works whenever the lead has a phone number.</p>
      </div>

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
    </SettingsLayout>
  );
}
