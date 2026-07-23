"use client";

import { withBase } from "@/lib/base-path";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp, Check, MessageCircle, Sparkles, X } from "lucide-react";
import {
  NUDGE_COOLDOWN_DAYS,
  NUDGE_EXCLUDED_PATHS,
  nudgeTextFor,
  type BotNudge,
} from "@/lib/bot-nudge";

type Turn = { role: "user" | "assistant"; content: string };

const NUDGE_KEY = "ds-bot-nudge-seen";
const PEEK_KEY = "ds-bot-peek-seen";
const PEEK_TEXT = "👋 Need help? Ask DigiSutra Bot";

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
export default function SutraBot({ nudge }: { nudge?: BotNudge }) {
  const pathname = usePathname();
  const [teaser, setTeaser] = useState<string | null>(null);
  const [peek, setPeek] = useState(false);
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

  /* Proactive greeting: fires on a delay OR a scroll depth, whichever comes
     first, once per visitor per cooldown. Skipped on conversion pages, once
     the panel has been opened, and after a lead is captured. */
  useEffect(() => {
    if (!nudge?.enabled || open || teaser) return;
    if (NUDGE_EXCLUDED_PATHS.some((p) => pathname.startsWith(p))) return;

    const text = nudgeTextFor(nudge, pathname);
    if (!text) return;

    try {
      const seen = Number(localStorage.getItem(NUDGE_KEY) ?? 0);
      if (seen && Date.now() - seen < NUDGE_COOLDOWN_DAYS * 86400000) return;
    } catch {
      /* private mode — fall through and just show it once this session */
    }

    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      setTeaser(text);
      try {
        localStorage.setItem(NUDGE_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
    };

    const timer = setTimeout(fire, nudge.delaySeconds * 1000);
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && (window.scrollY / max) * 100 >= nudge.scrollPercent) fire();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    /* Exit intent: pointer crosses the top edge of the viewport. Guarded on
       a fine pointer so a touch device, where the event is meaningless and
       can fire spuriously, never triggers it. */
    const onExit = (e: MouseEvent) => {
      if (e.clientY <= 0 && e.relatedTarget === null) fire();
    };
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (nudge.exitIntent && fine) {
      document.addEventListener("mouseout", onExit);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseout", onExit);
    };
  }, [nudge, pathname, open, teaser]);

  /* Peek greeting (Sample C): a light bubble slides out shortly after load
     on the first visit, holds a few seconds, then tucks away. It's the
     affordance cue — "this button talks to you" — while the richer nudge
     teaser above handles conversion. Suppressed on conversion pages, when
     the panel is open, and while the nudge teaser is active. */
  useEffect(() => {
    if (open || teaser) return;
    if (NUDGE_EXCLUDED_PATHS.some((p) => pathname.startsWith(p))) return;
    try {
      const seen = Number(localStorage.getItem(PEEK_KEY) ?? 0);
      if (seen && Date.now() - seen < NUDGE_COOLDOWN_DAYS * 86400000) return;
    } catch {
      /* private mode — just show it once this session */
    }
    const show = setTimeout(() => {
      setPeek(true);
      try {
        localStorage.setItem(PEEK_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
    }, 2800);
    const hide = setTimeout(() => setPeek(false), 2800 + 6500);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [open, teaser, pathname]);

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
      {/* Proactive greeting bubble */}
      {teaser && !open && (
        <div className="fixed bottom-[6.25rem] right-5 z-[130] w-[min(17rem,calc(100vw-2.5rem))] rounded-2xl rounded-br-sm border border-stone-700 bg-stone-900 p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
          <p className="text-sm leading-relaxed text-stone-100">{teaser}</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => {
                setTeaser(null);
                setOpen(true);
              }}
              className="cursor-pointer rounded-full bg-[#F26419] px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-orange-600"
            >
              Yes, show me
            </button>
            <button
              onClick={() => setTeaser(null)}
              className="cursor-pointer rounded-full border border-stone-600 px-3 py-1.5 text-xs font-semibold text-stone-400 transition-colors hover:text-white"
            >
              No thanks
            </button>
          </div>
        </div>
      )}

      {/* Peek greeting (Sample C) — a light bubble that floats just above
          the launcher, clearing the desktop "Ask DigiSutra Bot" label.
          Suppressed while the panel is open or the richer teaser card is
          showing, so the two greetings never stack. */}
      {peek && !teaser && !open && (
        <div className="animate-bot-peek fixed bottom-[5.75rem] right-5 z-[129] w-max max-w-[13rem] origin-bottom-right lg:hidden">
          <div className="relative rounded-2xl rounded-br-sm border border-stone-200 bg-white py-2 pl-3 pr-7 shadow-[0_12px_30px_rgba(124,45,18,0.16)]">
            <button
              onClick={() => {
                setPeek(false);
                setOpen(true);
              }}
              className="cursor-pointer text-left text-[13px] font-semibold leading-snug text-stone-800"
            >
              {PEEK_TEXT}
            </button>
            <button
              onClick={() => setPeek(false)}
              aria-label="Dismiss greeting"
              className="absolute right-1.5 top-1.5 cursor-pointer rounded-full p-0.5 text-stone-400 transition-colors hover:text-stone-700"
            >
              <X size={12} aria-hidden />
            </button>
            {/* tail pointing down at the launcher */}
            <span
              aria-hidden
              className="absolute -bottom-1 right-6 h-2.5 w-2.5 rotate-45 border-b border-r border-stone-200 bg-white"
            />
          </div>
        </div>
      )}

      <button
        onClick={() => {
          setTeaser(null);
          setPeek(false);
          setOpen((v) => !v);
        }}
        aria-label="Chat with DigiSutra Bot"
        aria-expanded={open}
        className={`group fixed bottom-5 right-5 z-[130] cursor-pointer items-center gap-2.5 ${
          open ? "hidden" : "flex"
        }`}
      >
        <span className="hidden whitespace-nowrap rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-stone-900 shadow-[0_8px_24px_rgba(0,0,0,0.18)] lg:block">
          Need help? Ask DigiSutra Bot
        </span>
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#F26419] text-white shadow-[0_10px_26px_rgba(0,0,0,0.28)] transition-transform duration-200 group-hover:scale-105">
          {/* Breathing halo (Sample B) — a soft disc that expands and fades
              at rest. Sits behind the icon; paused for reduced-motion. */}
          <span
            aria-hidden
            className="animate-bot-breathe pointer-events-none absolute inset-0 rounded-full bg-[#F26419]"
          />
          <Sparkles size={24} className="relative" aria-hidden />
          {teaser && (
            <span className="absolute -right-0.5 -top-0.5 z-[1] flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white">
              1
            </span>
          )}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="DigiSutra Bot"
          className="fixed inset-x-3 bottom-3 z-[135] flex h-[min(68vh,480px)] flex-col overflow-hidden rounded-2xl border border-stone-700 bg-stone-900 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:h-[min(70vh,540px)] sm:w-[360px] lg:h-[min(72vh,580px)] lg:w-[380px]"
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
            {/* Primary route to WhatsApp now that the floating button is gone */}
            <a
              href={WA_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 flex items-center justify-center gap-2 rounded-full border border-[#25D366]/50 bg-[#25D366]/10 py-2 text-xs font-bold text-[#4ADE80] transition-colors hover:bg-[#25D366]/20"
            >
              <MessageCircle size={13} aria-hidden /> Talk to a human on WhatsApp
            </a>
          </div>
        </div>
      )}
    </>
  );
}
