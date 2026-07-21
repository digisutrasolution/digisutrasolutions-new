"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import { Check, Copy, Sparkles, Wand2 } from "lucide-react";

type Field = { name: string; label: string; placeholder: string; required?: boolean };

/* Shared UI for the AI tools. The API decides whether a model or the
   built-in template produced the answer and tells us, so the badge is
   always honest about what the reader is looking at. */
export default function AiToolForm({
  kind,
  fields,
  cta,
  note,
}: {
  kind: "blog-outline" | "chatbot-flow";
  fields: Field[];
  cta: string;
  note: string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [source, setSource] = useState<"gemini" | "anthropic" | "template" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const required = fields.filter((f) => f.required);
  const ready = required.every((f) => (values[f.name] ?? "").trim().length > 1);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError("");
    setOutput("");
    try {
      const res = await fetch(withBase("/api/tools/ai"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, ...values }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not generate that — try again.");
      } else {
        setOutput(json.output);
        setSource(json.source);
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the text is selectable */
    }
  };

  return (
    <div className="rounded-[2rem] bg-[#FFF6EF] p-6 sm:p-8">
      <form onSubmit={run} className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.name} className={fields.length === 1 ? "sm:col-span-2" : "block"}>
            <span className="text-sm font-semibold text-stone-700">
              {f.label}
              {!f.required && <span className="font-normal text-stone-400"> (optional)</span>}
            </span>
            <input
              value={values[f.name] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
              placeholder={f.placeholder}
              className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none transition-colors focus:border-orange-500"
            />
          </label>
        ))}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={!ready || busy}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#F26419] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
          >
            <Wand2 size={15} aria-hidden /> {busy ? "Working…" : cta}
          </button>
        </div>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {output && (
        <div className="mt-6 overflow-hidden rounded-2xl bg-stone-900">
          <div className="flex items-center justify-between gap-3 border-b border-stone-700 px-5 py-3">
            <span className="flex items-center gap-2 text-xs font-semibold text-stone-300">
              <Sparkles size={13} className="text-[#FDBA74]" aria-hidden />
              {source === "template"
                ? "Built from our template — a solid starting structure"
                : "Generated for you"}
            </span>
            <button
              onClick={copy}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-stone-600 px-3 py-1.5 text-xs font-bold text-stone-200 transition-colors hover:border-[#F26419] hover:text-white"
            >
              {copied ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap px-5 py-4 font-sans text-sm leading-relaxed text-stone-100">
            {output}
          </pre>
        </div>
      )}

      <p className="mt-5 text-xs leading-relaxed text-stone-500">{note}</p>
    </div>
  );
}
