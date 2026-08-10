"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { withBase } from "@/lib/base-path";

/* The claim half of an offer page.

   "I've followed" is a statement of intent, not a verified fact — no platform
   API can confirm a follow, and the copy says so rather than implying a check
   that is not happening. */

export default function OfferClaim({
  token,
  ctaLabel,
}: {
  token: string;
  ctaLabel: string;
}) {
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function claim() {
    setState("busy");
    setError("");
    try {
      const res = await fetch(withBase(`/api/outreach/${token}/claim`), { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not get a code. Please try again.");
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

  if (state === "done") {
    return (
      <div className="rounded-3xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-800">
          Your code
        </p>
        <p className="font-display mt-2 select-all text-3xl font-extrabold tracking-tight text-green-900">
          {code}
        </p>
        <button
          onClick={() =>
            void navigator.clipboard.writeText(code).then(() => setCopied(true)).catch(() => {})
          }
          className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-green-300 px-4 py-2 text-xs font-semibold text-green-900 transition-colors hover:bg-green-100"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy code"}
        </button>
        <p className="mt-3 text-sm text-green-800">
          Quote it when you get in touch and we&rsquo;ll apply it to your quote.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <button
        onClick={() => void claim()}
        disabled={state === "busy"}
        className="w-full cursor-pointer rounded-full bg-[#F26419] px-8 py-4 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60 sm:w-auto"
      >
        {state === "busy" ? "Getting your code…" : ctaLabel}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      <p className="mt-3 text-xs text-stone-500">
        One code per client. We take your word for it — we can&rsquo;t see who follows us.
      </p>
    </div>
  );
}
