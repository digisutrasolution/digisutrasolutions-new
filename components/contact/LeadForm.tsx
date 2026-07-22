"use client";

import { withBase } from "@/lib/base-path";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import ServicePicker from "@/components/contact/ServicePicker";
import {
  DEPARTMENTS,
  HEARD_FROM,
  type DepartmentKey,
} from "@/lib/contact-channels";

const DRAFT_KEY = "ds-lead-draft";

const EMAIL_TYPOS: Record<string, string> = {
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "hotmial.com": "hotmail.com",
  "hotnail.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloook.com": "outlook.com",
};

const BUDGETS = ["Under ₹25,000", "₹25,000 – ₹50,000", "₹50,000 – ₹1,00,000", "₹1,00,000+", "One-time project"];
const TIMELINES = ["Immediately", "This month", "This quarter", "Just exploring"];

type Fields = {
  name: string;
  company: string;
  email: string;
  whatsapp: string;
  website: string;
  department: DepartmentKey;
  services: string[];
  budget: string;
  timeline: string;
  heardFrom: string;
  message: string;
};

const EMPTY: Fields = {
  name: "", company: "", email: "", whatsapp: "", website: "",
  department: "SALES",
  services: [], budget: "", timeline: "", heardFrom: "", message: "",
};

const inputCls = (invalid: boolean, valid?: boolean) =>
  `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-300 ${
    invalid
      ? "border-red-400 focus:border-red-500"
      : valid
        ? "border-emerald-500"
        : "border-stone-200 focus:border-[#F26419]"
  }`;

export default function LeadForm({ serviceNames }: { serviceNames: string[] }) {
  const [f, setF] = useState<Fields>(EMPTY);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const startedAt = useRef<number>(0);

  // Restore autosaved draft + arm the time-trap (deferred past first paint).
  useEffect(() => {
    const t = setTimeout(() => {
      startedAt.current = Date.now();
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) setF((prev) => ({ ...prev, ...JSON.parse(raw) }));
      } catch {
        /* ignore corrupt draft */
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => {
    setF((prev) => {
      const next = { ...prev, [k]: v };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      } catch {
        /* storage full/blocked — autosave is best-effort */
      }
      return next;
    });
  };
  const touch = (k: string) => setTouched((p) => ({ ...p, [k]: true }));

  const nameOk = f.name.trim().length >= 2;
  const waOk = /^\+?[0-9][0-9\s-]{7,17}$/.test(f.whatsapp.trim());
  const emailOk = f.email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim());
  const emailDomain = f.email.split("@")[1]?.toLowerCase();
  const emailSuggestion = emailDomain && EMAIL_TYPOS[emailDomain]
    ? f.email.replace(emailDomain, EMAIL_TYPOS[emailDomain])
    : null;
  // Only a sales enquiry needs a service picked — a client reporting a
  // broken form should not have to categorise their own problem first.
  const isSales = f.department === "SALES";
  const servicesOk = !isSales || f.services.length > 0;
  const canSubmit = nameOk && waOk && emailOk && servicesOk && status !== "sending";
  const activeDept = DEPARTMENTS.find((d) => d.key === f.department) ?? DEPARTMENTS[0];

  const submit = async () => {
    setStatus("sending");
    setErrMsg("");
    try {
      const res = await fetch(withBase("/api/leads"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.name.trim(),
          whatsapp: f.whatsapp.trim(),
          email: f.email.trim(),
          website: f.website.trim(),
          company: f.company.trim() || undefined,
          department: f.department,
          services: f.services,
          budget: f.budget || undefined,
          timeline: f.timeline || undefined,
          heardFrom: f.heardFrom || undefined,
          message: f.message.trim() || undefined,
          source: "CONTACT",
          hp: "",
          startedAt: startedAt.current,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* best-effort */ }
      setStatus("done");
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : "Something went wrong — try WhatsApp instead.");
      setStatus("error");
    }
  };

  return (
    <div className="h-full overflow-hidden rounded-[2rem] border border-stone-200 bg-white">
      <div className="flex h-full flex-col p-6 sm:p-8">
        {status === "done" ? (
          <div className="flex h-full flex-col items-center justify-center py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check size={26} aria-hidden />
            </span>
            <h2 className="font-display mt-4 text-2xl font-extrabold text-stone-900">Got it, {f.name.split(" ")[0] || "done"}!</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-600">
              {isSales
                ? "We'll reply on WhatsApp within one working day — your 15-page audit lands within 48 hours."
                : `Your message is with the ${activeDept.label.toLowerCase()} desk. We'll reply on WhatsApp within one working day.`}
            </p>
            <a
              href="https://wa.me/919953900123"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold text-white"
            >
              Jump the queue on WhatsApp <ArrowRight size={14} aria-hidden />
            </a>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-stone-900">
              Send us a message
            </h2>
            <p className="mt-1.5 text-sm text-stone-500">
              We reply within one working day — usually much sooner on WhatsApp.
            </p>

            {/* Department first: it decides which inbox this lands in. */}
            <div className="mt-6">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                What is this about? *
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {DEPARTMENTS.map((d) => {
                  const on = f.department === d.key;
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => set("department", d.key)}
                      aria-pressed={on}
                      className={`cursor-pointer rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        on
                          ? "border-[#F26419] bg-orange-50"
                          : "border-stone-200 bg-white hover:border-orange-300"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-bold text-stone-900">
                        <d.icon
                          size={15}
                          aria-hidden
                          className={on ? "text-[#F26419]" : "text-stone-400"}
                        />
                        {d.short}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-stone-500">
                Goes to{" "}
                <a
                  href={`mailto:${activeDept.email}`}
                  className="font-semibold text-orange-700 hover:underline"
                >
                  {activeDept.email}
                </a>{" "}
                · {activeDept.phone}
              </p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="lf-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">Name *</label>
                <input
                  id="lf-name"
                  value={f.name}
                  onChange={(e) => set("name", e.target.value)}
                  onBlur={() => touch("name")}
                  className={inputCls(Boolean(touched.name && !nameOk), nameOk)}
                  placeholder="Priya Sharma"
                  autoComplete="name"
                />
                {touched.name && !nameOk && (
                  <p className="mt-1 text-xs text-red-600">Add your name so we know who to reply to.</p>
                )}
              </div>
              <div>
                <label htmlFor="lf-wa" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">WhatsApp *</label>
                <input
                  id="lf-wa"
                  value={f.whatsapp}
                  onChange={(e) => set("whatsapp", e.target.value)}
                  onBlur={() => touch("whatsapp")}
                  className={inputCls(Boolean(touched.whatsapp && !waOk), waOk)}
                  placeholder="+91 98765 43210"
                  inputMode="tel"
                  autoComplete="tel"
                />
                {touched.whatsapp && !waOk && (
                  <p className="mt-1 text-xs text-red-600">That number doesn&rsquo;t look right — include the country code, e.g. +91.</p>
                )}
              </div>
              <div>
                <label htmlFor="lf-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">Email</label>
                <input
                  id="lf-email"
                  value={f.email}
                  onChange={(e) => set("email", e.target.value)}
                  onBlur={() => touch("email")}
                  className={inputCls(Boolean(touched.email && !emailOk))}
                  placeholder="you@company.com"
                  inputMode="email"
                  autoComplete="email"
                />
                {emailSuggestion && (
                  <button
                    onClick={() => set("email", emailSuggestion)}
                    className="mt-1 cursor-pointer text-xs text-red-600"
                  >
                    Did you mean <b className="underline">{emailSuggestion}</b>? Tap to fix.
                  </button>
                )}
                {touched.email && !emailOk && !emailSuggestion && (
                  <p className="mt-1 text-xs text-red-600">That email looks incomplete — check it or leave it blank.</p>
                )}
              </div>
              <div>
                <label htmlFor="lf-company" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Company <span className="font-medium normal-case text-stone-400">(optional)</span>
                </label>
                <input
                  id="lf-company"
                  value={f.company}
                  onChange={(e) => set("company", e.target.value)}
                  className={inputCls(false, Boolean(f.company.trim()))}
                  placeholder="Acme Pvt Ltd"
                  autoComplete="organization"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="lf-web" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Website <span className="normal-case text-[#F26419]">→ audit input</span>
                </label>
                <input
                  id="lf-web"
                  value={f.website}
                  onChange={(e) => set("website", e.target.value)}
                  className={inputCls(false, Boolean(f.website.trim()))}
                  placeholder="company.com"
                  inputMode="url"
                />
              </div>
            </div>

            <div className={`mt-5 ${isSales ? "" : "hidden"}`}>
              <ServicePicker
                options={serviceNames}
                value={f.services}
                onChange={(next) => set("services", next)}
                invalid={Boolean(touched.submit && !servicesOk)}
              />
              {touched.submit && !servicesOk && (
                <p className="mt-1 text-xs text-red-600">Pick at least one — it routes you to the right specialist.</p>
              )}
            </div>

            <div className={`mt-5 grid gap-4 sm:grid-cols-2 ${isSales ? "" : "hidden"}`}>
              <div>
                <label htmlFor="lf-budget" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">Monthly budget</label>
                <select id="lf-budget" value={f.budget} onChange={(e) => set("budget", e.target.value)} className={inputCls(false, Boolean(f.budget))}>
                  <option value="">Select a range…</option>
                  {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="lf-when" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">How soon?</label>
                <select id="lf-when" value={f.timeline} onChange={(e) => set("timeline", e.target.value)} className={inputCls(false, Boolean(f.timeline))}>
                  <option value="">Select…</option>
                  {TIMELINES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Attribution. Chips beat a select on mobile — one tap, and the
                options stay visible instead of hiding behind a scroll. */}
            <div className="mt-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                How did you find us?{" "}
                <span className="font-medium normal-case text-stone-400">(optional)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {HEARD_FROM.map((h) => {
                  const on = f.heardFrom === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => set("heardFrom", on ? "" : h)}
                      aria-pressed={on}
                      className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                        on
                          ? "bg-stone-900 text-white"
                          : "border border-stone-200 bg-white text-stone-600 hover:border-orange-400"
                      }`}
                    >
                      {on ? "✓ " : ""}{h}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="lf-msg" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">Anything else? <span className="font-medium normal-case text-stone-400">(optional)</span></label>
              <textarea
                id="lf-msg"
                value={f.message}
                onChange={(e) => set("message", e.target.value)}
                className={`${inputCls(false)} min-h-20`}
                placeholder="Goals, deadlines, what's not working…"
              />
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => { touch("submit"); if (canSubmit) void submit(); }}
                disabled={status === "sending"}
                className="flex-1 cursor-pointer rounded-full bg-[#F26419] py-3.5 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
              >
                {status === "sending"
                  ? "Sending…"
                  : isSales
                    ? "Send — get my audit in 48h"
                    : `Send to ${activeDept.label.toLowerCase()}`}
              </button>
              <a
                href="https://wa.me/919953900123?text=Hi%20DigiSutra!%20I%27d%20rather%20chat%20than%20fill%20a%20form."
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Skip the form — WhatsApp us"
                title="Skip the form — WhatsApp us"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white transition-transform hover:scale-105"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </a>
            </div>
            {status === "error" && <p className="mt-2 text-center text-xs text-red-600">{errMsg}</p>}
            <p className="mt-auto pt-3 text-center text-[11px] text-stone-400">
              Autosaves as you type · spam-guarded without a captcha · WCAG AA
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
