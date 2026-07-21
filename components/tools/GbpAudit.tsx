"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Circle } from "lucide-react";

/* Google Business Profile self-audit. A live audit would need the Google
   Places API and a billing account, so this is an honest guided
   checklist: you answer, it scores and tells you what to fix first. */

type Check = { key: string; label: string; weight: number; fix: string };

const CHECKS: Check[] = [
  { key: "verified", label: "Profile is verified (no 'claim this business' banner)", weight: 15, fix: "Verify the listing — until then it barely ranks and anyone can suggest edits." },
  { key: "category", label: "Primary category matches your main service exactly", weight: 12, fix: "Set the most specific primary category; it drives which searches you appear in." },
  { key: "hours", label: "Opening hours are filled in and current (incl. holidays)", weight: 8, fix: "Add hours and special-day hours — wrong hours are a common one-star trigger." },
  { key: "photos", label: "10+ real photos, added within the last 90 days", weight: 10, fix: "Upload recent interior, exterior, team and work photos. Stock images don't count." },
  { key: "reviews", label: "25+ reviews with a 4.0+ average", weight: 12, fix: "Ask happy customers with a direct review link — never incentivise reviews." },
  { key: "replies", label: "Every review from the last 6 months has a reply", weight: 10, fix: "Reply to all reviews, especially negative ones. It's a documented ranking and trust factor." },
  { key: "services", label: "Services or products are listed with descriptions", weight: 8, fix: "Add each service with a short description — it feeds the 'services' search matches." },
  { key: "posts", label: "Posted an update in the last 30 days", weight: 7, fix: "Post monthly at minimum: an offer, an update, or a job you completed." },
  { key: "nap", label: "Name, address and phone match your website exactly", weight: 10, fix: "Make NAP identical everywhere — mismatches split your local signals." },
  { key: "description", label: "Business description uses your main keywords naturally", weight: 8, fix: "Rewrite the 750-character description to say what you do, where, and for whom." },
];

export default function GbpAudit() {
  const [done, setDone] = useState<Record<string, boolean>>({});

  const score = useMemo(
    () => CHECKS.reduce((s, c) => s + (done[c.key] ? c.weight : 0), 0),
    [done],
  );
  const missing = CHECKS.filter((c) => !done[c.key]).sort((a, b) => b.weight - a.weight);

  const band =
    score >= 85
      ? { label: "Strong", tone: "text-emerald-700", bg: "bg-emerald-50" }
      : score >= 60
        ? { label: "Decent — gaps to close", tone: "text-amber-800", bg: "bg-amber-50" }
        : { label: "Needs work", tone: "text-red-700", bg: "bg-red-50" };

  return (
    <div className="grid gap-6 rounded-[2rem] bg-[#FFF6EF] p-6 sm:p-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-8">
      <div>
        <p className="text-sm font-semibold text-stone-700">
          Tick everything that&rsquo;s already true of your listing
        </p>
        <ul className="mt-3 space-y-2">
          {CHECKS.map((c) => {
            const on = Boolean(done[c.key]);
            return (
              <li key={c.key}>
                <button
                  onClick={() => setDone((d) => ({ ...d, [c.key]: !on }))}
                  aria-pressed={on}
                  className={`flex w-full cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-left transition-colors ${
                    on ? "border-emerald-300 bg-emerald-50/60" : "border-stone-200 bg-white hover:border-[#F26419]"
                  }`}
                >
                  {on ? (
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
                  ) : (
                    <Circle size={17} className="mt-0.5 shrink-0 text-stone-300" aria-hidden />
                  )}
                  <span className="text-sm text-stone-800">{c.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <div className={`rounded-2xl p-5 ${band.bg}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Your score</p>
          <p className={`font-display text-4xl font-extrabold ${band.tone}`}>{score}/100</p>
          <p className={`text-sm font-semibold ${band.tone}`}>{band.label}</p>
        </div>

        <p className="mt-5 text-sm font-semibold text-stone-700">
          {missing.length === 0 ? "Nothing left on this list — well run." : "Fix these first"}
        </p>
        <ul className="mt-2 space-y-2.5">
          {missing.slice(0, 4).map((c) => (
            <li key={c.key} className="rounded-xl bg-white p-3">
              <p className="flex items-center gap-1.5 text-xs font-bold text-orange-800">
                <AlertTriangle size={12} aria-hidden /> +{c.weight} points
              </p>
              <p className="mt-1 text-sm leading-relaxed text-stone-700">{c.fix}</p>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs leading-relaxed text-stone-500">
          This is a guided self-audit — we don&rsquo;t pull your listing automatically, because that
          needs a paid Google API. Want us to check it for you? It&rsquo;s part of the free 15-page
          audit.
        </p>
      </div>
    </div>
  );
}
