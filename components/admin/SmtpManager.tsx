"use client";

import { useState } from "react";
import { withBase } from "@/lib/base-path";
import { Check, Eye, EyeOff, PlugZap, Save, Trash2, X } from "lucide-react";

/** Shape the API returns: the password is replaced by a boolean. */
export type MaskedSmtp = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  fromName: string;
  fromEmail: string;
  hasPassword: boolean;
};

const fieldCls =
  "rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
const inputCls = `w-full ${fieldCls}`;
const labelCls = "mb-1 block text-xs font-semibold text-stone-500 dark:text-stone-400";

/* Common relays, so nobody has to remember whether 465 is implicit TLS. */
const PRESETS: Record<string, { host: string; port: number; secure: boolean }> = {
  "Gmail / Workspace": { host: "smtp.gmail.com", port: 587, secure: false },
  "Microsoft 365": { host: "smtp.office365.com", port: 587, secure: false },
  "cPanel (mail.yourdomain)": { host: "mail.digisutrasolutions.com", port: 465, secure: true },
  Brevo: { host: "smtp-relay.brevo.com", port: 587, secure: false },
  Zoho: { host: "smtp.zoho.in", port: 465, secure: true },
};

export default function SmtpManager({ initial }: { initial: MaskedSmtp }) {
  const [s, setS] = useState<MaskedSmtp>(initial);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [sendTo, setSendTo] = useState("");

  const set = <K extends keyof MaskedSmtp>(k: K, v: MaskedSmtp[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  async function save() {
    setState("saving");
    setError(null);
    try {
      const res = await fetch(withBase("/api/settings/smtp"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Blank password = keep the stored one (the server honours this).
        body: JSON.stringify({ ...s, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Save failed.");
        setState("error");
        return;
      }
      setS(json.smtp);
      setPassword("");
      setState("saved");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setError("Network error.");
      setState("error");
    }
  }

  async function test() {
    setTesting(true);
    setTestMsg(null);
    try {
      const res = await fetch(withBase("/api/settings/smtp/test"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send the current form so it can be tested before saving.
        body: JSON.stringify({
          smtp: { ...s, password },
          ...(sendTo ? { sendTo } : {}),
        }),
      });
      const json = await res.json().catch(() => ({}));
      setTestMsg({
        ok: Boolean(json.ok),
        text: json.ok ? json.message : (json.error ?? "Test failed."),
      });
    } catch {
      setTestMsg({ ok: false, text: "Network error." });
    } finally {
      setTesting(false);
    }
  }

  async function clearAll() {
    if (!window.confirm("Remove the SMTP settings? Email will stop sending.")) return;
    setState("saving");
    const res = await fetch(withBase("/api/settings/smtp"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled: false,
        host: "",
        port: 587,
        secure: false,
        user: "",
        password: "",
        fromName: "DigiSutra Solutions",
        fromEmail: "",
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (json.ok) {
      setS(json.smtp);
      setPassword("");
    }
    setState("idle");
  }

  return (
    <div>
      <label className="flex items-start gap-2.5 text-sm font-semibold text-stone-700 dark:text-stone-200">
        <input
          type="checkbox"
          checked={s.enabled}
          onChange={(e) => set("enabled", e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-orange-600"
        />
        <span>
          Send email through SMTP
          <span className="mt-0.5 block text-xs font-normal text-stone-500 dark:text-stone-400">
            Used for password resets, contact-form notifications and workflow
            alerts. When this is off the site falls back to the Resend API key
            if one is set, and otherwise sends nothing.
          </span>
        </span>
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={labelCls} style={{ marginBottom: 0 }}>
          Quick preset:
        </span>
        {Object.entries(PRESETS).map(([name, p]) => (
          <button
            key={name}
            onClick={() => {
              set("host", p.host);
              set("port", p.port);
              set("secure", p.secure);
            }}
            className="cursor-pointer rounded-full border border-stone-300 px-2.5 py-1 text-[11px] font-semibold text-stone-600 transition-colors hover:border-orange-400 hover:text-orange-700 dark:border-stone-700 dark:text-stone-300"
          >
            {name}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCls}>Host</label>
          <input
            value={s.host}
            onChange={(e) => set("host", e.target.value)}
            placeholder="mail.digisutrasolutions.com"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Port</label>
          <input
            type="number"
            value={s.port}
            onChange={(e) => set("port", Number(e.target.value))}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Encryption</label>
          <select
            value={s.secure ? "ssl" : "starttls"}
            onChange={(e) => set("secure", e.target.value === "ssl")}
            className={inputCls}
          >
            <option value="starttls">STARTTLS (usually port 587)</option>
            <option value="ssl">SSL/TLS (usually port 465)</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Username</label>
          <input
            value={s.user}
            onChange={(e) => set("user", e.target.value)}
            autoComplete="off"
            placeholder="noreply@digisutrasolutions.com"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>
            Password{" "}
            {s.hasPassword && (
              <span className="font-normal text-emerald-600">· saved</span>
            )}
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder={s.hasPassword ? "Leave blank to keep current" : ""}
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="cursor-pointer rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800"
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <div>
          <label className={labelCls}>From name</label>
          <input
            value={s.fromName}
            onChange={(e) => set("fromName", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>From address</label>
          <input
            value={s.fromEmail}
            onChange={(e) => set("fromEmail", e.target.value)}
            placeholder="noreply@digisutrasolutions.com"
            className={inputCls}
          />
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-3.5 dark:border-stone-700 dark:bg-stone-900/40">
        <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
          Test connection
        </p>
        <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
          Checks the current form — you do not have to save first. Add an
          address to send a real message and prove delivery end to end.
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <input
            value={sendTo}
            onChange={(e) => setSendTo(e.target.value)}
            placeholder="you@example.com (optional)"
            className={`${fieldCls} min-w-56 flex-1`}
          />
          <button
            onClick={test}
            disabled={testing || !s.host}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-stone-300 px-4 py-2 text-xs font-bold text-stone-700 transition-colors hover:border-orange-400 hover:text-orange-700 disabled:opacity-50 dark:border-stone-600 dark:text-stone-200"
          >
            <PlugZap size={13} aria-hidden />
            {testing ? "Testing…" : "Test connection"}
          </button>
        </div>
        {testMsg && (
          <p
            className={`mt-2.5 flex items-start gap-1.5 text-xs font-semibold ${
              testMsg.ok ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {testMsg.ok ? (
              <Check size={13} className="mt-0.5 shrink-0" />
            ) : (
              <X size={13} className="mt-0.5 shrink-0" />
            )}
            {testMsg.text}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={save}
          disabled={state === "saving"}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50"
        >
          <Save size={13} aria-hidden /> {state === "saving" ? "Saving…" : "Save SMTP"}
        </button>
        <button
          onClick={clearAll}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-stone-300 px-3.5 py-2 text-xs font-semibold text-stone-500 transition-colors hover:border-red-300 hover:text-red-600 dark:border-stone-700"
        >
          <Trash2 size={13} aria-hidden /> Remove
        </button>
        {state === "saved" && (
          <span className="text-xs font-semibold text-emerald-600">Saved.</span>
        )}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-stone-400">
        The password is stored write-only: it is never sent back to this page,
        so the field stays blank once saved. Leave it blank to keep the current
        one.
      </p>
    </div>
  );
}
