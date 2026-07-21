"use client";

import { useMemo, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";

/* Business name generator — combines your keyword with proven naming
   patterns. Domain availability isn't checked here (that needs a registrar
   API), so each idea links out to a search you can run yourself. */

const PREFIX = ["Go", "Up", "Neo", "Nova", "Prime", "Bright", "True", "Via", "Zen", "Aura"];
const SUFFIX = ["ly", "ify", "hub", "labs", "works", "craft", "sutra", "wala", "kart", "verse"];
const PAIRED = ["Studio", "Collective", "Partners", "Digital", "Ventures", "Co", "House", "Group"];
const SANSKRIT = ["Sutra", "Vidya", "Shakti", "Disha", "Setu", "Kriya", "Udaan", "Prakash"];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const pick = <T,>(arr: T[], n: number, seed: number) => {
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(arr[(seed + i * 3) % arr.length]);
  return out;
};

export default function NameGenerator() {
  const [word, setWord] = useState("");
  const [seed, setSeed] = useState(0);

  const groups = useMemo(() => {
    const w = word.trim().replace(/\s+/g, "").toLowerCase();
    if (w.length < 2) return [];
    const W = cap(w);
    return [
      { group: "Short & brandable", ideas: pick(SUFFIX, 5, seed).map((s) => `${W}${s}`) },
      { group: "With a prefix", ideas: pick(PREFIX, 5, seed + 1).map((p) => `${p}${W}`) },
      { group: "Professional", ideas: pick(PAIRED, 5, seed + 2).map((p) => `${W} ${p}`) },
      { group: "Indian roots", ideas: pick(SANSKRIT, 5, seed + 3).map((s) => `${W} ${s}`) },
    ];
  }, [word, seed]);

  return (
    <div className="rounded-[2rem] bg-[#FFF6EF] p-6 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="name-seed">
          Keyword
        </label>
        <input
          id="name-seed"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="A word your business is about — e.g. bloom, ledger, cart"
          className="h-12 w-full min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none transition-colors focus:border-orange-500"
        />
        <button
          onClick={() => setSeed((s) => s + 1)}
          disabled={word.trim().length < 2}
          className="inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#F26419] px-6 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          <RefreshCw size={15} aria-hidden /> Shuffle
        </button>
      </div>

      {groups.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <div key={g.group} className="rounded-2xl bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-orange-800">{g.group}</p>
              <ul className="mt-2 space-y-1.5">
                {g.ideas.map((idea) => (
                  <li key={idea} className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-bold text-stone-900">{idea}</span>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(`"${idea}" domain availability`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] font-semibold text-stone-400 transition-colors hover:text-[#F26419]"
                    >
                      check <ExternalLink size={10} aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs leading-relaxed text-stone-500">
        Before you commit: check the domain, the company name on the MCA register, and a trademark
        search. We don&rsquo;t check availability here — anything claiming to in one click is usually
        guessing.
      </p>
    </div>
  );
}
