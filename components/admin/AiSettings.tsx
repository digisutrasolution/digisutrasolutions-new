"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, CircleAlert, PlayCircle, Save, Sparkles } from "lucide-react";
import { withBase } from "@/lib/base-path";
import {
  AI_PROVIDER_META, type AiConfig, type AiProvider, type AiProviderId,
} from "@/lib/ai-config";
import SettingsLayout, { RailCard, ChecklistItem } from "@/components/admin/SettingsLayout";

type Availability = Record<AiProviderId, boolean>;
type TestState = { busy?: boolean; ok?: boolean; ms?: number; error?: string };

const inputCls =
  "rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

export default function AiSettings() {
  const [config, setConfig] = useState<AiConfig | null>(null);
  const [saved, setSaved] = useState<string>("");
  const [avail, setAvail] = useState<Availability>({ claude: false, ollama: false, gemini: false });
  const [tests, setTests] = useState<Record<string, TestState>>({});
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(withBase("/api/settings/ai"));
    const json = await res.json();
    if (json.ok) { setConfig(json.config); setSaved(JSON.stringify(json.config)); setAvail(json.availability); }
  }, []);
  useEffect(() => { const t = setTimeout(() => void load(), 0); return () => clearTimeout(t); }, [load]);

  if (!config) return <p className="text-xs text-stone-400">Loading…</p>;
  const dirty = JSON.stringify(config) !== saved;

  const setProviders = (fn: (ps: AiProvider[]) => AiProvider[]) => setConfig((c) => (c ? { ...c, providers: fn(c.providers) } : c));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= config.providers.length) return;
    setProviders((ps) => { const n = [...ps]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  };
  const setField = (id: AiProviderId, patch: Partial<AiProvider>) =>
    setProviders((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  async function save() {
    setBusy(true); setFlash("");
    try {
      const res = await fetch(withBase("/api/settings/ai"), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config }) });
      const json = await res.json();
      if (json.ok) { setConfig(json.config); setSaved(JSON.stringify(json.config)); setAvail(json.availability); setFlash("Saved."); }
      else setFlash(json.error ?? "Save failed.");
    } finally { setBusy(false); }
  }
  async function test(id: AiProviderId) {
    setTests((t) => ({ ...t, [id]: { busy: true } }));
    try {
      const res = await fetch(withBase("/api/settings/ai/test"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: id }) });
      const json = await res.json();
      setTests((t) => ({ ...t, [id]: { ok: json.ok, ms: json.latencyMs, error: json.error } }));
    } catch {
      setTests((t) => ({ ...t, [id]: { ok: false, error: "Request failed." } }));
    }
  }

  const activeChain = config.providers.filter((p) => p.enabled && avail[p.id]).map((p) => AI_PROVIDER_META[p.id].label);

  const rail = (
    <>
      <RailCard title="Active chain">
        {activeChain.length === 0 ? (
          <p className="text-xs text-amber-600">No provider is usable — enable one with its credential set.</p>
        ) : (
          <div className="space-y-1.5">
            {activeChain.map((label, i) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-700 dark:bg-orange-950 dark:text-orange-300">{i + 1}</span>
                <span className="font-semibold">{label}</span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2.5 text-[11px] leading-relaxed text-stone-400">Requests try providers top-to-bottom until one answers.</p>
      </RailCard>
      <RailCard title="Providers">
        {config.providers.map((p) => (
          <ChecklistItem key={p.id} done={avail[p.id]} label={AI_PROVIDER_META[p.id].label} hint={avail[p.id] ? "ready" : "credential missing"} />
        ))}
      </RailCard>
    </>
  );

  return (
    <SettingsLayout rail={rail}>
      {/* Ollama URL */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">Ollama URL</label>
        <input value={config.ollamaUrl} onChange={(e) => setConfig((c) => (c ? { ...c, ollamaUrl: e.target.value } : c))} placeholder="http://ollama:11434 (or leave blank to use OLLAMA_URL from env)" className={`${inputCls} w-full`} />
        <p className="mt-1 text-[11px] text-stone-400">Self-hosted Ollama endpoint — not a secret, so it lives here. Falls back to the env value if blank.</p>
      </div>

      {/* Providers */}
      <ol className="space-y-2">
        {config.providers.map((p, i) => {
          const meta = AI_PROVIDER_META[p.id];
          const ready = avail[p.id];
          const t = tests[p.id];
          return (
            <li key={p.id} className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
              <div className="flex items-start gap-3">
                <div className="flex flex-col pt-0.5">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="text-stone-300 hover:text-orange-600 disabled:opacity-30" aria-label="Move up"><ChevronUp size={16} /></button>
                  <button onClick={() => move(i, 1)} disabled={i === config.providers.length - 1} className="text-stone-300 hover:text-orange-600 disabled:opacity-30" aria-label="Move down"><ChevronDown size={16} /></button>
                </div>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-500 dark:bg-stone-800">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    {meta.label}
                    <span className="text-[11px] font-normal text-stone-400">{meta.sub}</span>
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px]">
                    {ready ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-1.5 py-0.5 font-semibold text-green-700 dark:bg-green-950 dark:text-green-300"><Check size={10} /> {meta.cred === "url" ? "URL set" : "key detected"}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-1.5 py-0.5 font-semibold text-stone-500 dark:bg-stone-800"><CircleAlert size={10} /> {meta.cred === "url" ? "no URL" : `set ${meta.envVar} in .env`}</span>
                    )}
                  </p>
                </div>
                {/* enable toggle */}
                <button onClick={() => setField(p.id, { enabled: !p.enabled })} title={p.enabled ? "Disable" : "Enable"} className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${p.enabled ? "bg-orange-500" : "bg-stone-300 dark:bg-stone-700"}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${p.enabled ? "left-4" : "left-0.5"}`} />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 pl-10">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Model</label>
                <input value={p.model} onChange={(e) => setField(p.id, { model: e.target.value })} className={`${inputCls} w-56`} />
                <button onClick={() => void test(p.id)} disabled={t?.busy} className="flex items-center gap-1 rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:border-orange-400 hover:text-orange-600 disabled:opacity-50 dark:border-stone-700 dark:text-stone-300">
                  <PlayCircle size={13} /> {t?.busy ? "Testing…" : "Test"}
                </button>
                {t && !t.busy && (
                  t.ok
                    ? <span className="text-xs font-semibold text-green-600">✓ {t.ms} ms</span>
                    : <span className="text-xs font-semibold text-red-500">✕ {t.error}</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex items-center gap-3">
        <button onClick={() => void save()} disabled={busy || !dirty} className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50">
          <Save size={15} /> {busy ? "Saving…" : "Save"}
        </button>
        {dirty && !flash && <span className="text-xs font-semibold text-amber-600">Unsaved changes</span>}
        {flash && <span className="flex items-center gap-1 text-xs font-semibold text-green-600"><Sparkles size={12} /> {flash}</span>}
      </div>
    </SettingsLayout>
  );
}
