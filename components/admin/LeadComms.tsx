"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, MessageCircle, MessageSquare, Send } from "lucide-react";
import { withBase } from "@/lib/base-path";
import { leadVars, renderTemplate, waLink, tgLink, tgHandle, type CommChannel } from "@/lib/comms";

type LeadLite = {
  name: string; company: string | null; email: string | null; whatsapp: string; telegram: string | null;
  city: string | null; country: string | null; services: string[]; budget: string | null;
};
type Template = { id: string; name: string; channel: CommChannel; subject: string; body: string; active: boolean };
type Comm = {
  id: string; channel: CommChannel; subject: string; body: string; status: string;
  openedAt: string | null; toAddress: string; userName: string | null; createdAt: string;
};

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

const STATUS_STYLE: Record<string, string> = {
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  OPENED: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const CHANNEL_ICON: Record<CommChannel, typeof Mail> = {
  EMAIL: Mail,
  WHATSAPP: MessageCircle,
  SMS: MessageSquare,
  TELEGRAM: Send,
};

export default function LeadComms({ leadId, lead, senderName }: { leadId: string; lead: LeadLite; senderName: string }) {
  const [channel, setChannel] = useState<CommChannel>(lead.email ? "EMAIL" : "WHATSAPP");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [tgUser, setTgUser] = useState(tgHandle(lead.telegram ?? ""));
  const [comms, setComms] = useState<Comm[]>([]);
  const [avail, setAvail] = useState<{ sms: boolean; telegram: boolean }>({ sms: false, telegram: false });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const vars = leadVars(lead, senderName);

  const loadComms = useCallback(async () => {
    const res = await fetch(withBase(`/api/leads/${leadId}/comms`));
    const json = await res.json();
    if (json.ok) {
      setComms(json.comms);
      if (json.channels) setAvail(json.channels);
    }
  }, [leadId]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch(withBase("/api/comm-templates?active=1"));
      const json = await res.json().catch(() => ({ ok: false }));
      if (json.ok) setTemplates(json.templates);
      await loadComms();
    }, 0);
    return () => clearTimeout(t);
  }, [loadComms]);

  function pick(id: string) {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    if (t.channel === "EMAIL") setSubject(renderTemplate(t.subject, vars));
    setBody(renderTemplate(t.body, vars));
  }

  const channelTemplates = templates.filter((t) => t.channel === channel);

  async function sendEmail() {
    if (!subject.trim() || !body.trim()) { setMsg("Subject and message are required."); return; }
    setBusy(true); setMsg("");
    try {
      const res = await fetch(withBase(`/api/leads/${leadId}/email`), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, templateId: templateId || null }),
      });
      const json = await res.json();
      if (json.ok) { setMsg("Email sent."); setSubject(""); setBody(""); setTemplateId(""); await loadComms(); }
      else setMsg(json.error ?? "Send failed.");
    } finally { setBusy(false); }
  }

  async function sendWhatsApp() {
    if (!body.trim()) { setMsg("Message is required."); return; }
    setBusy(true); setMsg("");
    try {
      window.open(waLink(lead.whatsapp, body), "_blank", "noopener,noreferrer");
      await fetch(withBase(`/api/leads/${leadId}/whatsapp`), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, templateId: templateId || null }),
      });
      setMsg("Opened WhatsApp & logged."); setBody(""); setTemplateId(""); await loadComms();
    } finally { setBusy(false); }
  }

  async function sendSms() {
    if (!body.trim()) { setMsg("Message is required."); return; }
    setBusy(true); setMsg("");
    try {
      const res = await fetch(withBase(`/api/leads/${leadId}/sms`), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, templateId: templateId || null }),
      });
      const json = await res.json();
      if (json.ok) { setMsg("SMS sent."); setBody(""); setTemplateId(""); await loadComms(); }
      else setMsg(json.error ?? "SMS failed."); if (!json.ok) await loadComms();
    } finally { setBusy(false); }
  }

  async function sendTelegram() {
    const handle = tgHandle(tgUser);
    if (!handle) { setMsg("Enter the lead's Telegram @username."); return; }
    if (!body.trim()) { setMsg("Message is required."); return; }
    setBusy(true); setMsg("");
    try {
      // Telegram DM links can't prefill text, so copy it for a quick paste.
      try { await navigator.clipboard.writeText(body); } catch { /* clipboard blocked */ }
      window.open(tgLink(handle), "_blank", "noopener,noreferrer");
      const res = await fetch(withBase(`/api/leads/${leadId}/telegram`), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, handle, templateId: templateId || null }),
      });
      const json = await res.json();
      if (json.ok) { setMsg("Copied message & opened Telegram — paste to send."); setBody(""); setTemplateId(""); await loadComms(); }
      else setMsg(json.error ?? "Failed.");
    } finally { setBusy(false); }
  }

  const smsCount = body.length ? Math.ceil(body.length / 160) : 0;

  const tab = (c: CommChannel, active: boolean) =>
    `flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${active ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900" : "text-stone-500 hover:text-stone-800 dark:text-stone-400"}`;

  const switchTo = (c: CommChannel) => { setChannel(c); setTemplateId(""); setMsg(""); };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-sm font-bold">Send a message</h2>
        <div className="inline-flex flex-wrap rounded-full border border-stone-200 p-0.5 dark:border-stone-800">
          <button onClick={() => switchTo("EMAIL")} className={tab("EMAIL", channel === "EMAIL")}><Mail size={12} /> Email</button>
          <button onClick={() => switchTo("WHATSAPP")} className={tab("WHATSAPP", channel === "WHATSAPP")}><MessageCircle size={12} /> WhatsApp</button>
          {avail.sms && <button onClick={() => switchTo("SMS")} className={tab("SMS", channel === "SMS")}><MessageSquare size={12} /> SMS</button>}
          {avail.telegram && <button onClick={() => switchTo("TELEGRAM")} className={tab("TELEGRAM", channel === "TELEGRAM")}><Send size={12} /> Telegram</button>}
        </div>
      </div>

      {channel === "EMAIL" && !lead.email && <p className="mt-3 text-xs text-amber-600">This lead has no email address.</p>}
      {channel === "SMS" && (!lead.whatsapp || lead.whatsapp === "—") && <p className="mt-3 text-xs text-amber-600">This lead has no phone number.</p>}

      <div className="mt-3 space-y-2">
        {channelTemplates.length > 0 && (
          <select value={templateId} onChange={(e) => pick(e.target.value)} className={inputCls} aria-label="Template">
            <option value="">Start from a template…</option>
            {channelTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
        {channel === "EMAIL" && (
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className={inputCls} disabled={!lead.email} />
        )}
        {channel === "TELEGRAM" && (
          <input value={tgUser} onChange={(e) => setTgUser(e.target.value)} placeholder="Lead's Telegram @username" className={inputCls} />
        )}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder={`Write to ${lead.name}…`}
          className={inputCls}
          disabled={channel === "EMAIL" && !lead.email}
        />
        {channel === "SMS" && (
          <p className="text-right text-[11px] text-stone-400">{body.length} chars · {smsCount} SMS</p>
        )}
        <div className="flex items-center gap-3">
          {channel === "EMAIL" && (
            <button onClick={() => void sendEmail()} disabled={busy || !lead.email} className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50">
              <Send size={14} /> {busy ? "Sending…" : "Send email"}
            </button>
          )}
          {channel === "WHATSAPP" && (
            <button onClick={() => void sendWhatsApp()} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1fb457] disabled:opacity-50">
              <MessageCircle size={14} /> {busy ? "Opening…" : "Open in WhatsApp"}
            </button>
          )}
          {channel === "SMS" && (
            <button onClick={() => void sendSms()} disabled={busy || !lead.whatsapp || lead.whatsapp === "—"} className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50">
              <MessageSquare size={14} /> {busy ? "Sending…" : "Send SMS"}
            </button>
          )}
          {channel === "TELEGRAM" && (
            <button onClick={() => void sendTelegram()} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-[#229ED9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1b8ec2] disabled:opacity-50">
              <Send size={14} /> {busy ? "Opening…" : "Open in Telegram"}
            </button>
          )}
          {msg && <span className="text-xs font-semibold text-stone-500">{msg}</span>}
        </div>
      </div>

      {comms.length > 0 && (
        <div className="mt-4 border-t border-stone-100 pt-3 dark:border-stone-800">
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-400">Message history</h3>
          <ul className="space-y-2">
            {comms.map((c) => {
              const Icon = CHANNEL_ICON[c.channel] ?? Mail;
              return (
                <li key={c.id} className="flex items-start gap-2 text-xs">
                  <span className="mt-0.5 text-stone-400"><Icon size={13} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-stone-700 dark:text-stone-200">{c.subject || c.body}</p>
                    <p className="text-[11px] text-stone-400">
                      {c.userName ? `${c.userName} · ` : ""}
                      {new Date(c.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${STATUS_STYLE[c.status] ?? STATUS_STYLE.SENT}`}>
                    {c.status === "OPENED" ? "Opened" : c.status === "FAILED" ? "Failed" : "Sent"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
