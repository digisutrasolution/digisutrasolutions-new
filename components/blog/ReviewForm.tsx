"use client";

import { useState } from "react";
import { ShieldCheck, Star } from "lucide-react";

type State = "idle" | "sending" | "done" | "error";

/* Review form: star picker + honeypot + time-trap (no captcha puzzles).
   Submissions land in the admin moderation queue as PENDING. */
export default function ReviewForm({ postSlug }: { postSlug: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [hp, setHp] = useState("");
  // Time-trap baseline: set when the client initializes the form.
  const [mountedAt] = useState(() => Date.now());
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postSlug,
          name,
          email,
          body,
          rating: rating || undefined,
          hp,
          t: mountedAt,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong — try again.");
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setError("Network error — try again.");
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
        <p className="font-display font-bold">Thanks for the review!</p>
        <p className="mt-1">
          It will appear here once the team approves it — usually within a day.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-stone-200 bg-white p-5"
    >
      <p className="font-display text-sm font-bold text-stone-900">
        Leave a review
      </p>
      <div className="mt-2.5 flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n === rating ? 0 : n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="cursor-pointer p-0.5"
          >
            <Star
              size={20}
              aria-hidden
              className={
                n <= (hover || rating)
                  ? "fill-[#F26419] text-[#F26419]"
                  : "text-stone-300"
              }
            />
          </button>
        ))}
        <span className="ml-2 text-xs text-stone-400">
          {rating ? `${rating}/5` : "optional"}
        </span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input
          type="text"
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          aria-label="Name"
          className="rounded-xl border border-stone-200 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#F26419] focus:outline-none"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (never shown)"
          aria-label="Email"
          className="rounded-xl border border-stone-200 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#F26419] focus:outline-none"
        />
      </div>
      <textarea
        required
        minLength={10}
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What did you try? What worked?"
        aria-label="Your review"
        className="mt-2 w-full rounded-xl border border-stone-200 bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#F26419] focus:outline-none"
      />
      <input
        type="text"
        name="website_url"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
      />
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs text-stone-400">
          <ShieldCheck size={12} aria-hidden /> spam-guarded · reviews appear
          after approval
        </p>
        <button
          type="submit"
          disabled={state === "sending"}
          className="cursor-pointer rounded-full bg-[#F26419] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-orange-700 disabled:opacity-60"
        >
          {state === "sending" ? "Posting…" : "Post review"}
        </button>
      </div>
    </form>
  );
}
