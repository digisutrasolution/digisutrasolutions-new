"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import { ArrowRight, Check, Mail } from "lucide-react";

/* Compact inline subscribe row for the home journal section — posts to the
   real newsletter endpoint (the old design linked "subscribe" to /contact,
   which is a bait-and-switch). Honeypot stays empty; bots that fill it get
   a fake success from the API. */
export default function HomeSubscribe() {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError("");
    try {
      const res = await fetch(withBase("/api/newsletter"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "home", hp }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Something went wrong — try again.");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setError("Network error — try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="mt-auto flex items-center gap-2.5 border-t border-dashed border-[#F0E2D6] px-3 pb-1 pt-4 text-sm font-semibold text-emerald-700">
        <Check size={15} className="shrink-0" aria-hidden />
        You&apos;re in — growth notes land monthly.
      </p>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-auto border-t border-dashed border-[#F0E2D6] px-3 pb-1 pt-4"
    >
      <label
        htmlFor="home-subscribe-email"
        className="flex items-center gap-2 text-sm text-stone-600"
      >
        <Mail size={15} className="shrink-0 text-[#F26419]" aria-hidden />
        Get growth notes monthly
      </label>
      {/* Honeypot — humans never see it */}
      <input
        type="text"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <div className="mt-2.5 flex gap-2">
        <input
          id="home-subscribe-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="h-11 w-full min-w-0 flex-1 rounded-full border border-stone-300 bg-white px-4 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          aria-label="Subscribe"
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#F26419] text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
        >
          <ArrowRight size={16} aria-hidden />
        </button>
      </div>
      {status === "error" && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </form>
  );
}
