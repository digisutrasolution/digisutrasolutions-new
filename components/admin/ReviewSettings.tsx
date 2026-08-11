"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { withBase } from "@/lib/base-path";
import { googleReviewUrl, type ReviewsConfig } from "@/lib/reviews-config";

/* Settings behind the review-request link, alongside the testimonials they
   feed. Everything is copy except the Place ID, which is what makes the
   Google button appear at all. */

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
const labelCls = "mb-1 block text-xs font-semibold";

export default function ReviewSettings({ initial }: { initial: ReviewsConfig }) {
  const [cfg, setCfg] = useState<ReviewsConfig>(initial);
  const [state, setState] = useState<"idle" | "busy" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  const set = <K extends keyof ReviewsConfig>(k: K, v: ReviewsConfig[K]) => {
    setCfg((prev) => ({ ...prev, [k]: v }));
    setState("idle");
  };

  async function save() {
    setState("busy");
    setError("");
    try {
      const res = await fetch(withBase("/api/settings/reviews"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not save.");
        setState("error");
        return;
      }
      setState("saved");
    } catch {
      setError("Network error.");
      setState("error");
    }
  }

  const placeId = cfg.placeId.trim();

  return (
    /* Matches its sibling tabs: a short intro, then content — no second card
       and no heading, since the tab already names this. Fields are capped at a
       reading width; stretched across a wide monitor a one-line input is a
       hundred characters long and hard to scan. */
    <div className="max-w-3xl">
      <p className="mb-3 text-xs text-stone-500 dark:text-stone-400">
        The page a client lands on from a <strong>Review link</strong>. They can
        leave a testimonial — it arrives in the Testimonials tab, hidden, for you
        to approve — and, if a Place ID is set, review you on Google.
      </p>
      <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-snug text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
        Everyone who opens the link is asked for both, whatever they are about
        to say. Showing the Google button only to happy clients is review
        gating — Google&rsquo;s policy prohibits it and reviews collected that
        way get removed.
      </p>

      <div className="space-y-3">
        <div>
          <label htmlFor="rv-place" className={labelCls}>
            Google Place ID
          </label>
          <input
            id="rv-place"
            value={cfg.placeId}
            onChange={(e) => set("placeId", e.target.value)}
            placeholder="ChIJ…"
            className={inputCls}
          />
          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
            Blank means no Google button at all — better than one that goes
            nowhere. Find yours with the site&rsquo;s own{" "}
            <a
              href={withBase("/free-tools/google-review-link")}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-orange-700 hover:underline dark:text-orange-400"
            >
              Google Review Link Generator
            </a>
            .
          </p>
          {placeId && (
            <a
              href={googleReviewUrl(placeId)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 hover:underline dark:text-orange-400"
            >
              <ExternalLink size={12} aria-hidden /> Test this link
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="rv-heading" className={labelCls}>Page heading</label>
            <input id="rv-heading" value={cfg.heading} onChange={(e) => set("heading", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="rv-cta" className={labelCls}>Google button label</label>
            <input id="rv-cta" value={cfg.googleCta} onChange={(e) => set("googleCta", e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label htmlFor="rv-intro" className={labelCls}>Intro</label>
          <textarea id="rv-intro" rows={2} value={cfg.intro} onChange={(e) => set("intro", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="rv-note" className={labelCls}>Note under the Google button</label>
          <textarea id="rv-note" rows={2} value={cfg.googleNote} onChange={(e) => set("googleNote", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="rv-thanks" className={labelCls}>Thank-you message</label>
          <input id="rv-thanks" value={cfg.thanks} onChange={(e) => set("thanks", e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => void save()}
          disabled={state === "busy"}
          className="cursor-pointer rounded-full bg-[#F26419] px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
        >
          {state === "busy" ? "Saving…" : "Save review settings"}
        </button>
        {state === "saved" && (
          <span role="status" className="text-xs font-semibold text-green-700 dark:text-green-400">
            Saved.
          </span>
        )}
        {state === "error" && (
          <span role="alert" className="text-xs font-semibold text-red-700 dark:text-red-400">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
