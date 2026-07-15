"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import { Mail, Send } from "lucide-react";

type State = "idle" | "sending" | "done" | "error";

/* Dark newsletter card — subscribers stored in the CMS (admin → Subscribers). */
export default function NewsletterCard({ source = "blog" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const [state, setState] = useState<State>("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    try {
      const res = await fetch(withBase("/api/newsletter"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source, hp }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="rounded-2xl bg-stone-900 p-5">
      <Mail size={18} className="text-[#FDBA74]" aria-hidden />
      <p className="font-display mt-2.5 text-sm font-bold text-white">
        Growth notes, monthly
      </p>
      <p className="mt-1 text-sm leading-relaxed text-stone-400">
        One useful email a month. Unsubscribe anytime.
      </p>
      {state === "done" ? (
        <p className="mt-3 rounded-xl bg-emerald-950/60 px-3 py-2.5 text-sm font-medium text-emerald-300">
          You&rsquo;re in — see you in the next issue.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-3">
          <div className="flex gap-2">
            <label htmlFor={`nl-${source}`} className="sr-only">
              Email address
            </label>
            <input
              id={`nl-${source}`}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com"
              className="min-w-0 flex-1 rounded-full border border-stone-700 bg-stone-800 px-4 py-2 text-sm text-white placeholder:text-stone-500 focus:border-[#F26419] focus:outline-none"
            />
            <input
              type="text"
              name="company_url"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
            />
            <button
              type="submit"
              disabled={state === "sending"}
              aria-label="Subscribe"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#F26419] text-white transition-colors hover:bg-orange-700 disabled:opacity-60"
            >
              <Send size={14} aria-hidden />
            </button>
          </div>
          {state === "error" && (
            <p className="mt-2 text-xs text-red-400">
              That didn&rsquo;t work — check the address and try again.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
