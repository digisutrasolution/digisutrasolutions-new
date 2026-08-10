"use client";

import { withBase } from "@/lib/base-path";
import { readAttribution } from "@/lib/attribution";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import OtpVerify, { type Challenge } from "@/components/OtpVerify";
import { makeSpamToken } from "@/lib/spam";

const WA_HREF =
  "https://wa.me/919953900123?text=" +
  encodeURIComponent("Hi DigiSutra! I'd like a free growth audit for my website.");

const inputCls =
  "w-full rounded-xl bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none ring-2 ring-transparent transition-shadow focus:ring-stone-900/30";

/* Embedded lead form for the free-audit band — posts to /api/contact. */
export default function AuditForm() {
  const [status, setStatus] = useState<
    "idle" | "sending" | "verify" | "done" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [contact, setContact] = useState<{ whatsapp: string }>({ whatsapp: "" });
  const startedAt = useRef<number>(0);
  const jsToken = useRef<string>("");

  // Arm the time-trap and mint the proof-of-JS token once mounted.
  useEffect(() => {
    const t = setTimeout(() => {
      startedAt.current = Date.now();
      jsToken.current = makeSpamToken();
    }, 0);
    return () => clearTimeout(t);
  }, []);

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
          startedAt: startedAt.current,
          attribution: readAttribution(),
          jsToken: jsToken.current,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Something went wrong. Try WhatsApp instead.");
        setStatus("error");
        return;
      }
      /* Verification is soft and skippable — the request is already captured,
         so this only lets the visitor prove the number they gave. */
      if (json.verify) {
        setContact({ whatsapp: String(data.whatsapp ?? "") });
        setChallenge(json.verify as Challenge);
        setStatus("verify");
        return;
      }
      setStatus("done");
    } catch {
      setError("Network error. Try WhatsApp instead.");
      setStatus("error");
    }
  }

  if (status === "verify" && challenge) {
    return (
      <div className="mt-7 max-w-md rounded-2xl bg-white p-5">
        <OtpVerify
          challenge={challenge}
          resend={async () => {
            try {
              const res = await fetch(withBase("/api/otp/send"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: contact.whatsapp }),
              });
              const d = await res.json();
              return d.ok && d.challenge ? { id: d.challenge.id } : null;
            } catch {
              return null;
            }
          }}
          onVerified={() => setStatus("done")}
          onSkip={() => setStatus("done")}
        />
      </div>
    );
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
    // Capped for phones, then it fills whatever column it is dropped into —
    // the audit band widens past max-w-md on tablets and unfolded foldables,
    // while /free-audit keeps it narrow via its own wrapper.
    <form onSubmit={onSubmit} className="mt-7 max-w-md sm:max-w-none">
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
