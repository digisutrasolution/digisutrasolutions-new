"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Copy, GitCompareArrows, Sparkles, Wand2 } from "lucide-react";
import { withBase } from "@/lib/base-path";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/crm";

type Dup = { id: string; name: string; company: string | null; status: string; assignedToName: string | null; reason: string; confidence: "high" | "medium" | "low" };
type Brief = { summary: string; nextAction: string; provider: string };

const CONF_STYLE: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  low: "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400",
};

export default function LeadInsights({ leadId }: { leadId: string }) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [dups, setDups] = useState<Dup[]>([]);

  const loadDups = useCallback(async () => {
    const res = await fetch(withBase(`/api/leads/${leadId}/duplicates`));
    const json = await res.json().catch(() => ({}));
    if (json.ok) setDups(json.duplicates);
  }, [leadId]);
  useEffect(() => { const t = setTimeout(() => void loadDups(), 0); return () => clearTimeout(t); }, [loadDups]);

  async function generate() {
    setBusy(true); setErr(""); setBrief(null);
    try {
      const res = await fetch(withBase(`/api/leads/${leadId}/ai-summary`), { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (json.ok) setBrief({ summary: json.summary, nextAction: json.nextAction, provider: json.provider });
      else setErr(json.error ?? "AI request failed.");
    } catch {
      setErr("AI request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 font-display text-sm font-bold"><Sparkles size={15} className="text-orange-500" /> AI brief</h2>
        <button onClick={() => void generate()} disabled={busy} className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-2.5 py-1 text-xs font-semibold text-stone-600 hover:border-orange-400 hover:text-orange-600 disabled:opacity-50 dark:border-stone-700 dark:text-stone-300">
          <Wand2 size={13} /> {busy ? "Thinking…" : brief ? "Regenerate" : "Generate"}
        </button>
      </div>

      {err && <p className="mt-3 text-xs text-red-500">{err}</p>}
      {!brief && !err && <p className="mt-3 text-xs text-stone-400">Generate a quick summary and the best next action for this lead.</p>}

      {brief && (
        <div className="mt-3 space-y-3">
          <div>
            <p className="whitespace-pre-wrap text-sm text-stone-700 dark:text-stone-200">{brief.summary}</p>
          </div>
          {brief.nextAction && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/40">
              <p className="text-[11px] font-bold uppercase tracking-wide text-orange-700 dark:text-orange-300">Next best action</p>
              <p className="mt-0.5 text-sm text-stone-700 dark:text-stone-200">{brief.nextAction}</p>
            </div>
          )}
          <p className="flex items-center gap-1 text-[11px] text-stone-400">
            <Sparkles size={11} /> via {brief.provider}
            <button onClick={() => navigator.clipboard?.writeText(`${brief.summary}\n\nNext: ${brief.nextAction}`)} title="Copy" className="ml-1 hover:text-orange-600"><Copy size={12} /></button>
          </p>
        </div>
      )}

      {dups.length > 0 && (
        <div className="mt-4 border-t border-stone-100 pt-3 dark:border-stone-800">
          <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-500">
            <GitCompareArrows size={13} /> Possible duplicates ({dups.length})
          </h3>
          <ul className="mt-2 space-y-1.5">
            {dups.map((d) => (
              <li key={d.id}>
                <Link href={`/admin/leads/${d.id}`} className="flex items-center gap-2 rounded-lg border border-stone-200 p-2 transition-colors hover:bg-orange-50/40 dark:border-stone-800 dark:hover:bg-stone-800/40">
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${CONF_STYLE[d.confidence]}`}>{d.reason}</span>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-stone-800 dark:text-stone-100">{d.name}{d.company ? ` · ${d.company}` : ""}</span>
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${STATUS_STYLE[d.status as keyof typeof STATUS_STYLE] ?? ""}`}>{STATUS_LABEL[d.status as keyof typeof STATUS_LABEL] ?? d.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
