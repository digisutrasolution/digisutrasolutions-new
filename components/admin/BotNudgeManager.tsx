"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { KNOWN_SOURCES, type BotNudge } from "@/lib/bot-nudge";

/* Width is applied per field — inputCls must NOT carry w-full, or the rule
   rows stack instead of sitting on one line (Tailwind orders same-family
   utilities itself, so a later w-40 does not win over w-full). */
const fieldCls =
  "rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
const inputCls = `w-full ${fieldCls}`;
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

  const setSourceRule = (i: number, patch: Partial<BotNudge["sourceRules"][number]>) =>
    setNudge((p) => ({
      ...p,
      sourceRules: p.sourceRules.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
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
    <div>
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

      <label className="mt-4 flex items-start gap-2.5 text-sm text-stone-700 dark:text-stone-200">
        <input
          type="checkbox"
          checked={nudge.exitIntent}
          onChange={(e) => setNudge((p) => ({ ...p, exitIntent: e.target.checked }))}
          className="mt-0.5 h-4 w-4 accent-orange-600"
        />
        <span>
          Also show on exit intent
          <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-400">
            Fires when the mouse leaves toward the tab bar. Desktop only —
            touch devices have no equivalent signal, and the same weekly
            cooldown applies.
          </span>
        </span>
      </label>

      <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-3.5 dark:border-stone-700 dark:bg-stone-900/40">
        <label className="flex items-start gap-2.5 text-sm font-semibold text-stone-700 dark:text-stone-200">
          <input
            type="checkbox"
            checked={nudge.welcomeEnabled}
            onChange={(e) => setNudge((p) => ({ ...p, welcomeEnabled: e.target.checked }))}
            className="mt-0.5 h-4 w-4 accent-orange-600"
          />
          <span>
            First-visit welcome
            <span className="mt-0.5 block text-xs font-normal text-stone-500 dark:text-stone-400">
              Visitors who have never been here get this message instead of the
              page message below, on its own shorter timer. Returning visitors
              are unaffected.
            </span>
          </span>
        </label>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <div className="w-32">
            <label className={labelCls}>Delay (seconds)</label>
            <input
              type="number"
              min={3}
              max={120}
              value={nudge.welcomeDelaySeconds}
              onChange={(e) =>
                setNudge((p) => ({ ...p, welcomeDelaySeconds: Number(e.target.value) }))
              }
              className={inputCls}
            />
          </div>
          <div className="min-w-56 flex-1">
            <label className={labelCls}>Welcome message</label>
            <input
              value={nudge.welcomeText}
              onChange={(e) => setNudge((p) => ({ ...p, welcomeText: e.target.value }))}
              maxLength={160}
              placeholder="First time here? …"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3.5 dark:border-stone-700 dark:bg-stone-900/40">
        <label className="flex items-start gap-2.5 text-sm font-semibold text-stone-700 dark:text-stone-200">
          <input
            type="checkbox"
            checked={nudge.sourceEnabled}
            onChange={(e) => setNudge((p) => ({ ...p, sourceEnabled: e.target.checked }))}
            className="mt-0.5 h-4 w-4 accent-orange-600"
          />
          <span>
            Message per traffic source
            <span className="mt-0.5 block text-xs font-normal text-stone-500 dark:text-stone-400">
              Matched from the landing link, so it outranks both messages
              above. Use a key below, or type a campaign&rsquo;s own{" "}
              <code className="font-mono">utm_source</code> to target it by name.
            </span>
          </span>
        </label>
        <div className="mt-3 space-y-1.5">
          {nudge.sourceRules.map((r, i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(96px,140px)_minmax(0,1fr)_auto] items-center gap-2"
            >
              <input
                value={r.source}
                onChange={(e) => setSourceRule(i, { source: e.target.value })}
                placeholder="google-ads"
                list="admin-nudge-sources"
                className={`${fieldCls} w-full font-mono text-xs`}
              />
              <input
                value={r.text}
                onChange={(e) => setSourceRule(i, { text: e.target.value })}
                placeholder="Message shown in the bubble"
                maxLength={160}
                className={`${fieldCls} w-full`}
              />
              <button
                onClick={() =>
                  setNudge((p) => ({ ...p, sourceRules: p.sourceRules.filter((_, idx) => idx !== i) }))
                }
                aria-label={`Remove rule for ${r.source || "this source"}`}
                className="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <datalist id="admin-nudge-sources">
            {KNOWN_SOURCES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          {nudge.sourceRules.length < 10 && (
            <button
              onClick={() =>
                setNudge((p) => ({ ...p, sourceRules: [...p.sourceRules, { source: "", text: "" }] }))
              }
              className="flex cursor-pointer items-center gap-1.5 rounded-lg px-1 py-1.5 text-xs font-semibold text-orange-700 hover:underline"
            >
              <Plus size={13} /> Add a source message
            </button>
          )}
        </div>
      </div>

      <p className="mt-5 text-xs font-semibold text-stone-500 dark:text-stone-400">
        Message per page — the longest matching path wins; &ldquo;/&rdquo; is the fallback.
      </p>
      <div className="mt-2 space-y-1.5">
        {nudge.rules.map((r, i) => (
          <div
            key={i}
            className="grid grid-cols-[minmax(88px,132px)_minmax(0,1fr)_auto] items-center gap-2"
          >
            <input
              value={r.path}
              onChange={(e) => setRule(i, { path: e.target.value })}
              placeholder="/pricing"
              list="admin-nudge-paths"
              className={`${fieldCls} w-full font-mono text-xs`}
            />
            <input
              value={r.text}
              onChange={(e) => setRule(i, { text: e.target.value })}
              placeholder="Message shown in the bubble"
              maxLength={160}
              className={`${fieldCls} w-full`}
            />
            <button
              onClick={() => setNudge((p) => ({ ...p, rules: p.rules.filter((_, idx) => idx !== i) }))}
              aria-label={`Remove rule for ${r.path || "this page"}`}
              className="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <datalist id="admin-nudge-paths">
          {["/", "/pricing", "/services", "/work", "/blog", "/payment", "/free-tools", "/faq", "/about"].map(
            (p) => (
              <option key={p} value={p} />
            ),
          )}
        </datalist>
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
