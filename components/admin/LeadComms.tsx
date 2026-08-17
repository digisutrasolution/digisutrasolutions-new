"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mail, MessageCircle, MessageSquare, Paperclip, Plus, Send, X } from "lucide-react";
import { withBase } from "@/lib/base-path";
import { leadVars, renderTemplate, waLink, tgLink, tgHandle, type CommChannel } from "@/lib/comms";

type LeadLite = {
  name: string; company: string | null; email: string | null; whatsapp: string; telegram: string | null;
  city: string | null; country: string | null; services: string[]; budget: string | null;
};
type Template = { id: string; name: string; channel: CommChannel; subject: string; body: string; active: boolean };
type Comm = {
  id: string; channel: CommChannel; subject: string; body: string; status: string;
  attachments: string[]; openedAt: string | null; toAddress: string; userName: string | null; createdAt: string;
};
type LeadFile = { id: string; originalName: string; size: number; mimeType: string };

/** Mirrors MAX_TOTAL_ATTACHMENT_BYTES in lib/email — the server is the real
    gate; this only lets the UI warn before a doomed send. */
const MAX_TOTAL_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 10;

function fmtSize(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

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
  // Email + WhatsApp default on (matches config defaults) so tabs don't flash
  // out before availability loads.
  const [avail, setAvail] = useState<{ email: boolean; whatsapp: boolean; sms: boolean; telegram: boolean }>({
    email: true, whatsapp: true, sms: false, telegram: false,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  /* Attachments are the lead's OWN files, picked by id. Uploading from here
     files them against the lead as well as ticking them, so anything a client
     receives is also on record — an email is not a place to stash the only
     copy of a document. */
  const [files, setFiles] = useState<LeadFile[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const vars = leadVars(lead, senderName);
  const selected = files.filter((f) => picked.includes(f.id));
  const totalBytes = selected.reduce((n, f) => n + f.size, 0);
  const overSize = totalBytes > MAX_TOTAL_BYTES;

  const loadFiles = useCallback(async () => {
    const res = await fetch(withBase(`/api/attachments?leadId=${leadId}`));
    const json = await res.json().catch(() => ({ ok: false }));
    if (json.ok) setFiles(json.attachments);
  }, [leadId]);

  const toggleFile = (id: string) =>
    setPicked((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_FILES
          ? prev
          : [...prev, id],
    );

  /* Multiple files, uploaded one request at a time. The API takes a single
     file per POST, and sequencing them means one rejected file (wrong type,
     too big) reports its own name instead of failing the whole batch. */
  async function uploadFiles(list: FileList) {
    setUploading(true);
    setMsg("");
    const added: string[] = [];
    try {
      for (const file of Array.from(list)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("leadId", leadId);
        const res = await fetch(withBase("/api/attachments"), { method: "POST", body: fd });
        const json = await res.json().catch(() => ({ ok: false }));
        if (json.ok) added.push(json.attachment.id);
        else setMsg(`${file.name}: ${json.error ?? "upload failed"}`);
      }
      if (added.length) {
        setPicked((prev) => [...prev, ...added].slice(0, MAX_FILES));
        await loadFiles();
      }
    } finally {
      setUploading(false);
    }
  }

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
      await Promise.all([loadComms(), loadFiles()]);
    }, 0);
    return () => clearTimeout(t);
  }, [loadComms, loadFiles]);

  // If the selected channel becomes unavailable (admin turned it off), fall
  // back to the first live one. Deferred per repo convention.
  useEffect(() => {
    const on: Record<CommChannel, boolean> = { EMAIL: avail.email, WHATSAPP: avail.whatsapp, SMS: avail.sms, TELEGRAM: avail.telegram };
    if (on[channel]) return;
    const first = (["EMAIL", "WHATSAPP", "SMS", "TELEGRAM"] as CommChannel[]).find((c) => on[c]);
    if (!first) return;
    const t = setTimeout(() => setChannel(first), 0);
    return () => clearTimeout(t);
  }, [avail, channel]);

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
    if (overSize) { setMsg(`Attachments total ${fmtSize(totalBytes)} — the limit is ${fmtSize(MAX_TOTAL_BYTES)} per email.`); return; }
    setBusy(true); setMsg("");
    try {
      const res = await fetch(withBase(`/api/leads/${leadId}/email`), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, templateId: templateId || null, attachmentIds: picked }),
      });
      const json = await res.json();
      if (json.ok) {
        setMsg(picked.length ? `Email sent with ${picked.length} ${picked.length === 1 ? "file" : "files"}.` : "Email sent.");
        setSubject(""); setBody(""); setTemplateId(""); setPicked([]); setPickerOpen(false);
        await loadComms();
      }
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
          {avail.email && <button onClick={() => switchTo("EMAIL")} className={tab("EMAIL", channel === "EMAIL")}><Mail size={12} /> Email</button>}
          {avail.whatsapp && <button onClick={() => switchTo("WHATSAPP")} className={tab("WHATSAPP", channel === "WHATSAPP")}><MessageCircle size={12} /> WhatsApp</button>}
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

        {/* Email only. WhatsApp and Telegram are deep links out to another app
            and SMS has no attachment concept at all, so an attach button on
            those tabs would be a control that silently does nothing. */}
        {channel === "EMAIL" && (
          <div>
            {selected.length > 0 && (
              <ul className="mb-2 flex flex-wrap gap-1.5">
                {selected.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 py-1 pl-2.5 pr-1 text-xs dark:border-stone-700 dark:bg-stone-800"
                  >
                    <Paperclip size={11} className="shrink-0 text-stone-400" />
                    <span className="max-w-[180px] truncate font-medium text-stone-700 dark:text-stone-200">{f.originalName}</span>
                    <span className="text-[10px] text-stone-400">{fmtSize(f.size)}</span>
                    <button
                      onClick={() => toggleFile(f.id)}
                      aria-label={`Remove ${f.originalName}`}
                      className="rounded-full p-0.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700 dark:hover:bg-stone-700"
                    >
                      <X size={11} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setPickerOpen((v) => !v)}
                disabled={!lead.email}
                className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:border-orange-400 hover:text-orange-700 disabled:opacity-50 dark:border-stone-700 dark:text-stone-300"
              >
                <Paperclip size={13} /> Attach files
                {selected.length > 0 && <span className="text-stone-400">· {selected.length}</span>}
              </button>
              {selected.length > 0 && (
                <span className={`text-[11px] font-medium ${overSize ? "text-red-500" : "text-stone-400"}`}>
                  {fmtSize(totalBytes)} of {fmtSize(MAX_TOTAL_BYTES)}
                </span>
              )}
            </div>

            {pickerOpen && (
              <div className="mt-2 rounded-xl border border-stone-200 p-3 dark:border-stone-800">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
                    This lead&apos;s files
                  </p>
                  <button
                    onClick={() => fileInput.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1 rounded-lg border border-stone-300 px-2 py-1 text-[11px] font-semibold text-stone-600 hover:border-orange-400 hover:text-orange-700 disabled:opacity-50 dark:border-stone-700 dark:text-stone-300"
                  >
                    <Plus size={11} /> {uploading ? "Uploading…" : "Upload"}
                  </button>
                  {/* `multiple` — picking several at once was the gap; the
                      Files card's own input still took one at a time. */}
                  <input
                    ref={fileInput}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) void uploadFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>

                {files.length === 0 ? (
                  <p className="mt-2 text-xs text-stone-400">
                    No files on this lead yet — upload one to attach it.
                  </p>
                ) : (
                  <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto">
                    {files.map((f) => {
                      const on = picked.includes(f.id);
                      return (
                        <li key={f.id}>
                          <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-stone-50 dark:hover:bg-stone-800">
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => toggleFile(f.id)}
                              disabled={!on && picked.length >= MAX_FILES}
                              className="accent-orange-600"
                            />
                            <span className="min-w-0 flex-1 truncate text-xs text-stone-700 dark:text-stone-200">
                              {f.originalName}
                            </span>
                            <span className="shrink-0 text-[10px] text-stone-400">{fmtSize(f.size)}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="mt-2 text-[10px] text-stone-400">
                  Up to {MAX_FILES} files, {fmtSize(MAX_TOTAL_BYTES)} in total. Uploads are
                  saved to this lead&apos;s Files as well as sent.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          {channel === "EMAIL" && (
            <button onClick={() => void sendEmail()} disabled={busy || !lead.email || overSize} className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50">
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
                    {/* Names, not links: this records what was SENT, so it has
                        to keep reading correctly after the file is deleted
                        from the lead. */}
                    {c.attachments?.length > 0 && (
                      <p className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
                        <Paperclip size={10} className="shrink-0" />
                        <span className="truncate">{c.attachments.join(", ")}</span>
                      </p>
                    )}
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
