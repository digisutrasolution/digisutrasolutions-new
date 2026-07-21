"use client";

import { withBase } from "@/lib/base-path";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, MessageCircle, Sparkles, X } from "lucide-react";

type Turn = { role: "user" | "assistant"; content: string };

const OPENING =
  "Hi! I'm DigiSutra Bot. Tell me what you're trying to grow and I'll point you to the right service — or share prices, timelines and our free 15-page audit.";

const QUICK_REPLIES = [
  "More leads from Google",
  "I need a new website",
  "What does SEO cost?",
  "Book my free audit",
];

const WA_HREF =
  "https://wa.me/919953900123?text=" +
  encodeURIComponent("Hi DigiSutra! I was chatting with DigiSutra Bot on your site.");

/* DigiSutra Bot — floating chat panel. The transcript lives here; the API
   is stateless. After two exchanges (or on request) it offers the inline
   capture form, which writes a Lead with source SUTRABOT. */
export default function SutraBot() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([{ role: "assistant", content: OPENING }]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [lead, setLead] = useState({ name: "", whatsapp: "", hp: "" });
  const [leadState, setLeadState] = useState<"idle" | "sending" | "done">("idle");
  const scrollerRef = useRef<HTMLDivElement>(null);
  // Time-trap baseline for the lead endpoint; stamped after mount because
  // calling Date.now() during render is impure.
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const userTurns = turns.filter((t) => t.role === "user").length;
  const offerForm = showForm || (userTurns >= 2 && leadState !== "done");

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, busy, offerForm, leadState]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    const next: Turn[] = [...turns, { role: "user", content: message }];
    setTurns(next);
    setDraft("");
    setBusy(true);
    setError("");
    // Asking for the audit, a call or a human jumps straight to capture.
    if (/audit|call|human|talk|quote|contact/i.test(message)) setShowForm(true);
    try {
      const res = await fetch(withBase("/api/sutrabot"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turns: next.slice(-20) }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Something went wrong — try WhatsApp instead.");
      } else {
        setTurns((prev) => [...prev, { role: "assistant", content: json.reply }]);
      }
    } catch {
      setError("Network error — try WhatsApp instead.");
    } finally {
      setBusy(false);
    }
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (leadState === "sending") return;
    setLeadState("sending");
    setError("");
    try {
      const transcript = turns
        .map((t) => `${t.role === "user" ? "Visitor" : "Bot"}: ${t.content}`)
        .join("\n")
        .slice(0, 1900);
      const res = await fetch(withBase("/api/leads"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          whatsapp: lead.whatsapp,
          message: transcript,
          source: "SUTRABOT",
          hp: lead.hp,
          startedAt: startedAt.current,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Couldn't send that — try WhatsApp instead.");
        setLeadState("idle");
        return;
      }
      setLeadState("done");
      setTurns((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Thanks ${lead.name.split(" ")[0]} — a strategist will message you on WhatsApp, usually the same day. Anything else I can answer meanwhile?`,
        },
      ]);
    } catch {
      setError("Network error — try WhatsApp instead.");
      setLeadState("idle");
    }
  }

  return (
    <>
      {/* Primary launcher, bottom of the corner ladder (bot 20px, WhatsApp
          92px, back-to-top 156px). Hidden while the panel is open — the
          panel's header X closes it and the panel covers the ladder. */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat with DigiSutra Bot"
        aria-expanded={open}
        className={`group fixed bottom-5 right-5 z-[130] cursor-pointer items-center gap-2.5 ${
          open ? "hidden" : "flex"
        }`}
      >
        <span className="hidden rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-stone-900 shadow-[0_8px_24px_rgba(0,0,0,0.18)] lg:block">
          Ask DigiSutra Bot
        </span>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F26419] text-white shadow-[0_10px_26px_rgba(0,0,0,0.28)] transition-transform duration-200 group-hover:scale-105">
          <Sparkles size={24} aria-hidden />
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="DigiSutra Bot"
          className="fixed inset-x-3 bottom-3 top-[calc(var(--topbar-h)+80px)] z-[135] flex flex-col overflow-hidden rounded-2xl border border-stone-700 bg-stone-900 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:top-auto sm:h-[min(85vh,660px)] sm:w-[400px]"
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-stone-700 px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F26419] text-white">
              <Sparkles size={16} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="font-display block text-sm font-bold text-white">DigiSutra Bot</span>
              <span className="block text-[11px] text-emerald-400">● Online — replies instantly</span>
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="ml-auto cursor-pointer rounded-lg p-1 text-stone-400 transition-colors hover:bg-stone-800 hover:text-white"
            >
              <X size={17} aria-hidden />
            </button>
          </div>

          {/* Transcript */}
          <div ref={scrollerRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {turns.map((t, i) => (
              <div
                key={i}
                className={
                  t.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[#F26419] px-3.5 py-2.5 text-sm leading-relaxed text-white"
                    : "max-w-[90%] rounded-2xl rounded-bl-sm bg-stone-800 px-3.5 py-2.5 text-sm leading-relaxed text-stone-100"
                }
              >
                {t.content}
              </div>
            ))}

            {turns.length === 1 && !busy && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => void send(q)}
                    className="cursor-pointer rounded-full border border-[#F26419] px-3 py-1.5 text-xs font-semibold text-[#FDBA74] transition-colors hover:bg-[#F26419] hover:text-white"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {busy && (
              <div className="flex max-w-[60%] items-center gap-1.5 rounded-2xl rounded-bl-sm bg-stone-800 px-3.5 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-500 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-500 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-500" />
              </div>
            )}

            {/* Inline lead capture */}
            {offerForm && leadState !== "done" && (
              <form
                onSubmit={submitLead}
                className="rounded-2xl border border-stone-700 bg-stone-800/60 p-3.5"
              >
                <p className="text-xs font-semibold text-[#FDBA74]">
                  Want a human to take it from here?
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-stone-400">
                  Leave your name and WhatsApp — free audit or expert call, no obligation.
                </p>
                <input
                  type="text"
                  value={lead.hp}
                  onChange={(e) => setLead((p) => ({ ...p, hp: e.target.value }))}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  className="absolute -left-[9999px] h-0 w-0 opacity-0"
                />
                <div className="mt-2.5 space-y-2">
                  <input
                    required
                    value={lead.name}
                    onChange={(e) => setLead((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Your name"
                    className="h-10 w-full rounded-xl border border-stone-600 bg-stone-900 px-3 text-sm text-white outline-none transition-colors placeholder:text-stone-500 focus:border-[#F26419]"
                  />
                  <div className="flex gap-2">
                    <input
                      required
                      type="tel"
                      value={lead.whatsapp}
                      onChange={(e) => setLead((p) => ({ ...p, whatsapp: e.target.value }))}
                      placeholder="WhatsApp number"
                      className="h-10 w-full min-w-0 flex-1 rounded-xl border border-stone-600 bg-stone-900 px-3 text-sm text-white outline-none transition-colors placeholder:text-stone-500 focus:border-[#F26419]"
                    />
                    <button
                      type="submit"
                      disabled={leadState === "sending"}
                      className="shrink-0 cursor-pointer rounded-xl bg-[#F26419] px-4 text-xs font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
                    >
                      {leadState === "sending" ? "…" : "Send"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {leadState === "done" && (
              <p className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300">
                <Check size={14} aria-hidden /> Details sent — we&rsquo;ll be in touch.
              </p>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>

          {/* Composer */}
          <div className="border-t border-stone-700 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(draft);
              }}
              className="flex items-center gap-2"
            >
              <label className="sr-only" htmlFor="sutrabot-input">
                Message DigiSutra Bot
              </label>
              <input
                id="sutrabot-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                maxLength={1200}
                className="h-11 w-full min-w-0 flex-1 rounded-full border border-stone-600 bg-stone-800 px-4 text-sm text-white outline-none transition-colors placeholder:text-stone-500 focus:border-[#F26419]"
              />
              <button
                type="submit"
                disabled={busy || !draft.trim()}
                aria-label="Send message"
                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#F26419] text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
              >
                <ArrowUp size={18} aria-hidden />
              </button>
            </form>
            <a
              href={WA_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-stone-400 transition-colors hover:text-[#FDBA74]"
            >
              <MessageCircle size={12} aria-hidden /> Prefer WhatsApp? Talk to a human →
            </a>
          </div>
        </div>
      )}
    </>
  );
}
