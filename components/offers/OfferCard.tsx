"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Check, Copy, Loader2, Ticket } from "lucide-react";
import { withBase } from "@/lib/base-path";
import { hasAttribution, readAttribution } from "@/lib/attribution";
import { OFFER_TYPE_REQUIREMENT, occasion, offerType } from "@/lib/offer-kinds";

/* One offer, as a ticket.

   The perforated edge is the whole visual idea: an offer is a coupon, and a
   coupon has notches. It is drawn with two radial-gradient masks rather than
   pseudo-element circles, so it survives any background behind the card and
   costs nothing to composite. */

export type OfferView = {
  id: string;
  name: string;
  offerType: string;
  occasion: string | null;
  headline: string;
  body: string;
  discountValue: string;
  discountUnit: string;
  discountLabel: string;
  channels: { key: string; label: string; url: string }[];
  endsAt: string | null;
  remaining: number | null;
  claimed: number;
  maxClaims: number | null;
};

type State = "idle" | "form" | "busy" | "done" | "error";

/** "4 days left" / "6 hours left" — the coarsest true unit, never "0 days". */
function timeLeft(iso: string, now: number): string | null {
  const ms = new Date(iso).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} min left`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"} left`;
  return `${Math.floor(hours / 24)} days left`;
}

/* Module level so every card shares one interval instead of starting its own,
   and so the function identity is stable across renders — useSyncExternalStore
   resubscribes whenever it changes. */
function subscribeToMinute(onChange: () => void): () => void {
  const t = setInterval(onChange, 60_000);
  return () => clearInterval(t);
}

const field =
  "h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20";

export default function OfferCard({ offer, index }: { offer: OfferView; index: number }) {
  const [state, setState] = useState<State>("idle");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ name: "", whatsapp: "", email: "", hp: "" });

  /* The clock is external mutable state, so it is read through the hook built
     for exactly that rather than mirrored into useState from an effect.

     getSnapshot returns whole minutes, not Date.now(): it must be referentially
     stable between renders or React re-renders forever, and a value that only
     changes once a minute is also precisely the resolution this displays.
     getServerSnapshot returns null so the server emits no countdown at all —
     a time baked into HTML is wrong the moment it is cached, and it would
     hydrate against a different value in the browser. */
  const minute = useSyncExternalStore(
    subscribeToMinute,
    () => Math.floor(Date.now() / 60_000),
    () => null,
  );

  const left = useMemo(
    () => (offer.endsAt && minute !== null ? timeLeft(offer.endsAt, minute * 60_000) : null),
    [offer.endsAt, minute],
  );

  const kind = offerType(offer.offerType);
  const occ = occasion(offer.occasion);

  const pctGone =
    offer.maxClaims && offer.maxClaims > 0
      ? Math.min(100, Math.round((offer.claimed / offer.maxClaims) * 100))
      : null;
  const scarce = offer.remaining !== null && offer.remaining <= 5;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    setError("");
    const attr = readAttribution();
    try {
      const res = await fetch(withBase("/api/offers/claim"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promotionId: offer.id,
          ...form,
          ...(hasAttribution(attr) ? { attribution: attr } : {}),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not issue a code. Please try again.");
        setState("error");
        return;
      }
      setCode(json.code);
      setState("done");
    } catch {
      setError("Network error — please try again.");
      setState("error");
    }
  }

  return (
    <article
      className="offer-ticket group relative flex flex-col rounded-3xl border border-stone-200 bg-white p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(28,25,23,0.45)] sm:p-7"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      {/* Occasion ribbon — why this offer is running, when it is worth saying. */}
      {occ && (
        <span
          className={`mb-3 inline-block self-start rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${occ.className}`}
        >
          {occ.ribbon}
        </span>
      )}

      {/* ---- discount, at poster size ---- */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-5xl font-extrabold leading-none tracking-tighter text-[#F26419] sm:text-6xl">
            {offer.discountValue}
          </span>
          <span className="font-display text-lg font-extrabold uppercase tracking-tight text-stone-900">
            {offer.discountUnit}
          </span>
        </div>
        {left && (
          <span className="shrink-0 rounded-full bg-stone-900 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
            {left}
          </span>
        )}
      </div>

      <h3 className="font-display mt-5 text-xl font-extrabold tracking-tight text-stone-900">
        {offer.headline}
      </h3>
      {offer.body && (
        <p className="mt-2 text-sm leading-relaxed text-stone-600">{offer.body}</p>
      )}

      {/* ---- what you have to do, if anything ----
           Driven by the offer's type. An "open to everyone" festival offer
           showing a Follow us on block would be asking for something it does
           not actually require. */}
      {kind.requirementLabel && (kind.showsChannels ? offer.channels.length > 0 : true) && (
        <div className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">
            {kind.requirementLabel}
          </p>
          {kind.showsChannels ? (
            <ul className="mt-2.5 flex list-none flex-wrap gap-2">
              {offer.channels.map((c) => (
                <li key={c.key}>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center rounded-full border border-stone-300 px-4 text-[13px] font-semibold text-stone-700 transition-colors hover:border-[#F26419] hover:bg-orange-50 hover:text-orange-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F26419]"
                  >
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-sm text-stone-600">
              {OFFER_TYPE_REQUIREMENT[kind.key] ?? ""}
            </p>
          )}
        </div>
      )}

      {/* ---- perforation ---- */}
      <div className="offer-perf my-6" aria-hidden />

      {/* ---- scarcity, only when it is real ---- */}
      {pctGone !== null && (
        <div className="mb-4">
          <div className="flex items-baseline justify-between text-[11px] font-semibold">
            <span className={scarce ? "text-orange-800" : "text-stone-500"}>
              {offer.remaining} of {offer.maxClaims} left
            </span>
            <span className="tabular-nums text-stone-400">{pctGone}% claimed</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-[#F26419] transition-[width] duration-700"
              style={{ width: `${pctGone}%` }}
            />
          </div>
        </div>
      )}

      {/* ---- claim ---- */}
      <div className="mt-auto">
        {state === "done" ? (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-800">
              Your code
            </p>
            <p className="font-display mt-1.5 select-all text-3xl font-extrabold tracking-tight text-emerald-900">
              {code}
            </p>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(code);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-emerald-300 px-4 text-xs font-bold text-emerald-900 transition-colors hover:bg-emerald-100"
            >
              {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
              {copied ? "Copied" : "Copy code"}
            </button>
            <p className="mt-3 text-[11px] text-emerald-800">
              Quote it on your next enquiry — we&rsquo;ve saved it against your number.
            </p>
          </div>
        ) : state === "idle" ? (
          <button
            type="button"
            onClick={() => setState("form")}
            className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#F26419] px-6 text-sm font-bold text-white transition-colors hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F26419]"
          >
            <Ticket size={16} aria-hidden />
            Claim {offer.discountLabel}
          </button>
        ) : (
          <form onSubmit={submit} className="grid gap-2.5" noValidate>
            <div>
              <label htmlFor={`n-${offer.id}`} className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-stone-500">
                Your name
              </label>
              <input
                id={`n-${offer.id}`}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoComplete="name"
                className={field}
                placeholder="Full name"
              />
            </div>
            <div>
              <label htmlFor={`w-${offer.id}`} className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-stone-500">
                WhatsApp number
              </label>
              <input
                id={`w-${offer.id}`}
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                required
                type="tel"
                autoComplete="tel"
                className={field}
                placeholder="+91…"
              />
            </div>
            <div>
              <label htmlFor={`e-${offer.id}`} className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-stone-500">
                Email <span className="font-medium normal-case text-stone-400">(optional)</span>
              </label>
              <input
                id={`e-${offer.id}`}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                type="email"
                autoComplete="email"
                className={field}
                placeholder="you@company.com"
              />
            </div>
            {/* Honeypot — off-screen rather than display:none, which some bots skip. */}
            <input
              value={form.hp}
              onChange={(e) => setForm({ ...form, hp: e.target.value })}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={state === "busy"}
              className="mt-1 inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#F26419] px-6 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F26419]"
            >
              {state === "busy" && <Loader2 size={15} className="animate-spin" aria-hidden />}
              {state === "busy" ? "Getting your code…" : "Get my code"}
            </button>
            {/* The promise matches the mechanic — telling someone claiming an
                open festival offer that we cannot verify their follow would be
                nonsense. */}
            <p className="text-center text-[11px] leading-relaxed text-stone-400">
              {kind.claimNote}
            </p>
          </form>
        )}
      </div>
    </article>
  );
}
