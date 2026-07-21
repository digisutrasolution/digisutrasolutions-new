"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Info } from "lucide-react";
import { keywordIdeas } from "@/lib/tool-templates";

/* Keyword idea starters. Deliberately does NOT claim search volumes —
   those need a paid data provider, and inventing them would be worse
   than useless. This expands a seed into the shapes people actually
   search, ready to check in Search Console or a volume tool. */
export default function KeywordIdeas() {
  const [seed, setSeed] = useState("");
  const [city, setCity] = useState("");
  const [copied, setCopied] = useState(false);

  const groups = useMemo(() => keywordIdeas(seed, city), [seed, city]);
  const all = groups.flatMap((g) => g.ideas);

  const copyAll = async () => {
    if (all.length === 0) return;
    try {
      await navigator.clipboard.writeText(all.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="rounded-[2rem] bg-[#FFF6EF] p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-stone-700">Your service or product</span>
          <input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="e.g. digital marketing"
            className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none transition-colors focus:border-orange-500"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-stone-700">
            City <span className="font-normal text-stone-400">(optional)</span>
          </span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Noida"
            className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none transition-colors focus:border-orange-500"
          />
        </label>
      </div>

      {groups.length > 0 && (
        <>
          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-stone-700">{all.length} ideas</p>
            <button
              onClick={copyAll}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-bold text-stone-700 transition-colors hover:border-[#F26419] hover:text-orange-700"
            >
              {copied ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
              {copied ? "Copied" : "Copy all"}
            </button>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <div key={g.group} className="rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-orange-800">{g.group}</p>
                <ul className="mt-2 space-y-1.5">
                  {g.ideas.map((idea) => (
                    <li key={idea} className="text-sm leading-snug text-stone-700">
                      {idea}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-stone-500">
        <Info size={14} className="mt-0.5 shrink-0 text-[#F26419]" aria-hidden />
        These are idea starters, not search volumes — we don&rsquo;t show numbers we can&rsquo;t
        verify. Paste them into Google Search Console or your keyword tool to see which ones have
        demand, or ask us to do it in the free audit.
      </p>
    </div>
  );
}
