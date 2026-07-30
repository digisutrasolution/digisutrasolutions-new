"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Save } from "lucide-react";
import { withBase } from "@/lib/base-path";
import {
  BAND_LABEL,
  BAND_STYLE,
  SCORE_SIGNALS,
  type ScoringConfig,
  type SignalKey,
} from "@/lib/scoring";

const inputCls =
  "rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

export default function LeadScoring({ initialConfig }: { initialConfig: ScoringConfig }) {
  const [cfg, setCfg] = useState<ScoringConfig>(initialConfig);
  const [saved, setSaved] = useState<ScoringConfig>(initialConfig);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");

  const dirty = JSON.stringify(cfg) !== JSON.stringify(saved);

  // Points a signal is worth right now (override or its default).
  const pointsOf = (key: SignalKey) =>
    cfg.signals[key]?.points ?? SCORE_SIGNALS.find((s) => s.key === key)!.defaultPoints;
  const enabledOf = (key: SignalKey) => cfg.signals[key]?.enabled !== false;

  const maxPossible = useMemo(() => {
    let sum = 0;
    for (const s of SCORE_SIGNALS) {
      const ov = cfg.signals[s.key];
      if (ov?.enabled === false) continue;
      sum += Math.max(0, ov?.points ?? s.defaultPoints);
    }
    return Math.min(100, sum);
  }, [cfg]);

  function setSignal(key: SignalKey, patch: { enabled?: boolean; points?: number }) {
    setCfg((c) => {
      const cur = { enabled: enabledOf(key), points: pointsOf(key), ...c.signals[key] };
      return { ...c, signals: { ...c.signals, [key]: { ...cur, ...patch } } };
    });
  }
  function setBand(which: "hotMin" | "warmMin", value: number) {
    setCfg((c) => ({ ...c, [which]: value }));
  }

  async function save() {
    setBusy(true); setFlash("");
    try {
      const res = await fetch(withBase("/api/settings/scoring"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: cfg }),
      });
      const json = await res.json();
      if (json.ok) { setCfg(json.config); setSaved(json.config); setFlash("Saved."); }
      else setFlash(json.error ?? "Save failed.");
    } finally { setBusy(false); }
  }

  async function recompute() {
    setBusy(true); setFlash("");
    try {
      const res = await fetch(withBase("/api/leads/scoring/recompute"), { method: "POST" });
      const json = await res.json();
      setFlash(json.ok ? `Rescored ${json.count} leads.` : (json.error ?? "Failed."));
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      {/* Bands */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
        <h2 className="font-display text-sm font-bold">Bands</h2>
        <p className="mt-1 text-xs text-stone-500">Highest reachable score with the current weights: <strong>{maxPossible}</strong>.</p>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <label className="text-xs">
            <span className="mb-1 flex items-center gap-1.5 font-semibold uppercase tracking-wide text-stone-500">
              <span className={`rounded-full px-1.5 py-0.5 ${BAND_STYLE.HOT}`}>{BAND_LABEL.HOT}</span> at or above
            </span>
            <input type="number" min={cfg.warmMin + 1} max={100} value={cfg.hotMin} onChange={(e) => setBand("hotMin", Number(e.target.value))} className={`${inputCls} w-24`} />
          </label>
          <label className="text-xs">
            <span className="mb-1 flex items-center gap-1.5 font-semibold uppercase tracking-wide text-stone-500">
              <span className={`rounded-full px-1.5 py-0.5 ${BAND_STYLE.WARM}`}>{BAND_LABEL.WARM}</span> at or above
            </span>
            <input type="number" min={1} max={cfg.hotMin - 1} value={cfg.warmMin} onChange={(e) => setBand("warmMin", Number(e.target.value))} className={`${inputCls} w-24`} />
          </label>
          <p className="text-xs text-stone-500">Below {cfg.warmMin} is <span className={`rounded-full px-1.5 py-0.5 ${BAND_STYLE.COLD}`}>{BAND_LABEL.COLD}</span>.</p>
        </div>
      </div>

      {/* Signals */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-left dark:border-stone-800 dark:bg-stone-900">
              <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-stone-500">On</th>
              <th className="px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-stone-500">Signal</th>
              <th className="px-4 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-stone-500">Points</th>
            </tr>
          </thead>
          <tbody>
            {SCORE_SIGNALS.map((s) => {
              const on = enabledOf(s.key);
              return (
                <tr key={s.key} className="border-b border-stone-100 last:border-0 dark:border-stone-800/60">
                  <td className="px-4 py-2">
                    <button
                      onClick={() => setSignal(s.key, { enabled: !on })}
                      role="switch" aria-checked={on} aria-label={`Toggle ${s.label}`}
                      className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-orange-500" : "bg-stone-300 dark:bg-stone-700"}`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? "left-4" : "left-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <p className={`font-medium ${on ? "text-stone-800 dark:text-stone-100" : "text-stone-400"}`}>{s.label}</p>
                    <p className="text-[11px] text-stone-400">{s.hint}</p>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number" min={-50} max={100} value={pointsOf(s.key)} disabled={!on}
                      onChange={(e) => setSignal(s.key, { points: Number(e.target.value) })}
                      className={`${inputCls} w-20 text-right disabled:opacity-40`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => void save()} disabled={busy || !dirty} className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50">
          <Save size={15} /> {busy ? "Working…" : "Save"}
        </button>
        <button onClick={() => void recompute()} disabled={busy || dirty} title={dirty ? "Save first" : "Rescore all leads"} className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3.5 py-2 text-sm font-semibold text-stone-600 hover:border-orange-400 hover:text-orange-600 disabled:opacity-40 dark:border-stone-700 dark:text-stone-300">
          <RefreshCw size={14} /> Recompute all leads
        </button>
        {dirty && !flash && <span className="text-xs font-semibold text-amber-600">Unsaved changes</span>}
        {flash && <span className="text-xs font-semibold text-green-600">{flash}</span>}
      </div>
    </div>
  );
}
