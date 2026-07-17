"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import { Check } from "lucide-react";

const WA_HREF =
  "https://wa.me/919953900123?text=" +
  encodeURIComponent("Hi DigiSutra! I'd like a free growth audit for my website.");

const inputCls =
  "w-full rounded-xl bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none ring-2 ring-transparent transition-shadow focus:ring-stone-900/30";

/* Embedded lead form for the free-audit band — posts to /api/contact. */
export default function AuditForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    setError("");
    try {
      const res = await fetch(withBase("/api/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          whatsapp: data.whatsapp,
          siteUrl: data.siteUrl,
          service: "Free growth audit",
          hp: data.hp,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Something went wrong. Try WhatsApp instead.");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setError("Network error. Try WhatsApp instead.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="mt-7 max-w-md rounded-2xl bg-white/15 p-5">
        <p className="flex items-center gap-2 font-semibold text-white">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#F26419]">
            <Check size={14} aria-hidden />
          </span>
          Request received!
        </p>
        <p className="mt-1.5 text-sm text-orange-50/90">
          Your 15-page report lands within 48 hours. Want it faster?{" "}
          <a
            href={WA_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-white underline underline-offset-2"
          >
            WhatsApp us →
          </a>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-7 max-w-md">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <label className="sr-only" htmlFor="audit-name">
          Your name
        </label>
        <input
          id="audit-name"
          name="name"
          required
          placeholder="Your name"
          className={inputCls}
        />
        <label className="sr-only" htmlFor="audit-whatsapp">
          WhatsApp number
        </label>
        <input
          id="audit-whatsapp"
          name="whatsapp"
          required
          type="tel"
          placeholder="WhatsApp number"
          className={inputCls}
        />
        <label className="sr-only" htmlFor="audit-site">
          Your website
        </label>
        <input
          id="audit-site"
          name="siteUrl"
          required
          placeholder="yourwebsite.com"
          className={`${inputCls} sm:col-span-2`}
        />
        {/* Honeypot — humans never see or fill this */}
        <input
          name="hp"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="hidden"
        />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="shine-sweep mt-3 w-full cursor-pointer rounded-full bg-stone-900 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Get my free growth audit ↗"}
      </button>
      {status === "error" && (
        <p className="mt-2 text-sm font-medium text-white" role="alert">
          {error}
        </p>
      )}
      <p className="mt-3 text-sm text-orange-50/90">
        or{" "}
        <a
          href={WA_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-white underline underline-offset-2"
        >
          WhatsApp us →
        </a>{" "}
        · 15-page report in 48 hours · no strings
      </p>
    </form>
  );
}
