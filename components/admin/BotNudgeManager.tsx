"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import type { BotNudge } from "@/lib/bot-nudge";

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
const labelCls = "mb-1 block text-xs font-semibold text-stone-500 dark:text-stone-400";

export default function BotNudgeManager({ initial }: { initial: BotNudge }) {
  const [nudge, setNudge] = useState<BotNudge>(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const setRule = (i: number, patch: Partial<BotNudge["rules"][number]>) =>
    setNudge((p) => ({
      ...p,
      rules: p.rules.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    }));

  async function save() {
    setState("saving");
    setError(null);
    try {
      const res = await fetch(withBase("/api/settings/bot-nudge"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nudge }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Save failed.");
        setState("error");
        return;
      }
      setState("saved");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setError("Network error.");
      setState("error");
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-200">
          <input
            type="checkbox"
            checked={nudge.enabled}
            onChange={(e) => setNudge((p) => ({ ...p, enabled: e.target.checked }))}
          />
          Greeting enabled
        </label>
        <div className="w-32">
          <label className={labelCls}>Delay (seconds)</label>
          <input
            type="number"
            min={5}
            max={180}
            value={nudge.delaySeconds}
            onChange={(e) => setNudge((p) => ({ ...p, delaySeconds: Number(e.target.value) }))}
            className={inputCls}
          />
        </div>
        <div className="w-32">
          <label className={labelCls}>Or scroll (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={nudge.scrollPercent}
            onChange={(e) => setNudge((p) => ({ ...p, scrollPercent: Number(e.target.value) }))}
            className={inputCls}
          />
        </div>
      </div>

      <p className="mt-5 text-xs font-semibold text-stone-500 dark:text-stone-400">
        Message per page — the longest matching path wins; &ldquo;/&rdquo; is the fallback.
      </p>
      <div className="mt-2 space-y-2">
        {nudge.rules.map((r, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <input
              value={r.path}
              onChange={(e) => setRule(i, { path: e.target.value })}
              placeholder="/pricing"
              className={`${inputCls} w-40 shrink-0`}
            />
            <input
              value={r.text}
              onChange={(e) => setRule(i, { text: e.target.value })}
              placeholder="Message shown in the bubble"
              maxLength={160}
              className={`${inputCls} min-w-52 flex-1`}
            />
            <button
              onClick={() => setNudge((p) => ({ ...p, rules: p.rules.filter((_, idx) => idx !== i) }))}
              aria-label="Remove"
              className="cursor-pointer rounded-lg p-2 text-stone-400 hover:text-red-600"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {nudge.rules.length < 12 && (
          <button
            onClick={() => setNudge((p) => ({ ...p, rules: [...p.rules, { path: "/", text: "" }] }))}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-1 py-1.5 text-xs font-semibold text-orange-700 hover:underline"
          >
            <Plus size={13} /> Add a page message
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={state === "saving"}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50"
        >
          <Save size={13} aria-hidden /> {state === "saving" ? "Saving…" : "Save greeting"}
        </button>
        {state === "saved" && (
          <span className="text-xs font-semibold text-emerald-600">Saved — live immediately.</span>
        )}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-stone-400">
        Shown once per visitor per week, never on the contact page, and never after someone opens
        the chat or leaves their details.
      </p>
    </div>
  );
}
