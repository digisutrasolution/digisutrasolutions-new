"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import { Copy, Sparkles } from "lucide-react";
import { AI_KINDS, type AiKind } from "@/lib/ai-kinds";

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

/**
 * Generic AI assist panel. `kinds` limits the dropdown to the relevant
 * generators; `getContext` seeds the prompt from the surrounding editor.
 * Generated text is always shown for review before the editor uses it.
 */
export default function AiAssist({
  kinds,
  getContext,
  onInsert,
  insertLabel = "Insert",
}: {
  kinds: AiKind[];
  getContext?: () => string;
  onInsert?: (kind: AiKind, text: string) => void;
  insertLabel?: string;
}) {
  const [kind, setKind] = useState<AiKind>(kinds[0]);
  const [context, setContext] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function run() {
    setError(null);
    setBusy(true);
    setResult("");
    try {
      const ctx = context.trim() || getContext?.().trim() || "";
      if (!ctx) {
        setError("Add some context first (topic, draft, or notes).");
        return;
      }
      const res = await fetch(withBase("/api/ai/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, context: ctx }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Generation failed.");
        return;
      }
      setResult(json.text);
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  function copy() {
    void navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-5 dark:border-orange-900 dark:bg-orange-950/30">
      <p className="font-display flex items-center gap-2 text-sm font-bold text-orange-900 dark:text-orange-300">
        <Sparkles size={14} aria-hidden /> AI assist
      </p>
      <div className="mt-3 space-y-2.5">
        <div>
          <label htmlFor="ai-kind" className="mb-1 block text-xs font-semibold">
            Generate
          </label>
          <select
            id="ai-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as AiKind)}
            className={inputCls}
          >
            {kinds.map((k) => (
              <option key={k} value={k}>
                {AI_KINDS[k].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ai-context" className="mb-1 block text-xs font-semibold">
            Context {getContext ? "(blank = use current content)" : ""}
          </label>
          <textarea
            id="ai-context"
            rows={2}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Topic, notes, or extra direction…"
            className={inputCls}
          />
        </div>
        <button
          onClick={() => void run()}
          disabled={busy}
          className="cursor-pointer rounded-full bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-500 disabled:opacity-60"
        >
          {busy ? "Generating…" : "Generate"}
        </button>
        {error && (
          <p role="alert" className="text-xs font-medium text-red-700 dark:text-red-400">
            {error}
          </p>
        )}
        {result && (
          <div>
            <textarea
              rows={Math.min(12, Math.max(4, result.split("\n").length))}
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className={`${inputCls} text-xs leading-relaxed`}
              aria-label="Generated text (editable)"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={copy}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-stone-300 px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:border-orange-500 dark:border-stone-700 dark:text-stone-300"
              >
                <Copy size={11} aria-hidden /> {copied ? "Copied ✓" : "Copy"}
              </button>
              {onInsert && (
                <button
                  onClick={() => onInsert(kind, result)}
                  className="cursor-pointer rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-stone-700 dark:bg-orange-600"
                >
                  {insertLabel}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
