"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { withBase } from "@/lib/base-path";

/* The testimonial half of a review-request page.

   Note what this does NOT do: it never asks how happy you are first and then
   decides which button to show you. Routing satisfied clients to Google and
   unhappy ones to a private form is review gating, which Google's review
   policy prohibits and which gets reviews removed. Everyone sees the same two
   options, whatever they are about to write. */

export default function ReviewRequestForm({
  token,
  defaultName,
  thanks,
}: {
  token: string;
  defaultName: string;
  thanks: string;
}) {
  const [quote, setQuote] = useState("");
  const [name, setName] = useState(defaultName);
  const [role, setRole] = useState("");
  const [rating, setRating] = useState(5);
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const field =
    "w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200";

  async function submit() {
    setError(null);
    setState("busy");
    try {
      const res = await fetch(withBase(`/api/outreach/${token}/testimonial`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote: quote.trim(), name: name.trim(), role: role.trim(), rating }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("Network error — please try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
        <p className="font-display text-lg font-bold text-green-900">{thanks}</p>
        <p className="mt-1 text-sm text-green-800">
          We&rsquo;ll check it over before it appears on the site.
        </p>
      </div>
    );
  }

  const tooShort = quote.trim().length < 20;

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-6">
      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          How many stars?
        </legend>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              aria-pressed={rating === n}
              className="cursor-pointer rounded-lg p-1 transition-transform hover:scale-110"
            >
              <Star
                size={26}
                className={n <= rating ? "fill-[#F26419] text-[#F26419]" : "text-stone-300"}
                aria-hidden
              />
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <label htmlFor="rv-quote" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
          In your words
        </label>
        <textarea
          id="rv-quote"
          rows={5}
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="What did we do, and what changed for you?"
          className={field}
        />
        <p className="mt-1 text-[11px] text-stone-400">
          {tooShort ? "A sentence or two is plenty — at least 20 characters." : `${quote.trim().length} characters`}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="rv-name" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
            Your name
          </label>
          <input id="rv-name" value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="rv-role" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
            Role and company <span className="font-normal normal-case text-stone-400">(optional)</span>
          </label>
          <input
            id="rv-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Founder, Acme Retail"
            className={field}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <button
        onClick={() => void submit()}
        disabled={state === "busy" || tooShort || name.trim().length < 2}
        className="mt-5 w-full cursor-pointer rounded-full bg-stone-900 px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {state === "busy" ? "Sending…" : "Send my testimonial"}
      </button>
    </div>
  );
}
