"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, KeyRound, Plus, Trash2, X } from "lucide-react";
import { withBase } from "@/lib/base-path";
import { API_SCOPES, SCOPE_LABEL, type ApiScope } from "@/lib/integrations";

type ApiKey = {
  id: string; name: string; prefix: string; scopes: string[];
  lastUsedAt: string | null; revokedAt: string | null; createdByName: string | null; createdAt: string;
};

const inputCls =
  "rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

export default function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<ApiScope[]>(["leads:write"]);
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(withBase("/api/api-keys"));
    const json = await res.json();
    if (json.ok) setKeys(json.keys);
  }, []);
  useEffect(() => { const t = setTimeout(() => void load(), 0); return () => clearTimeout(t); }, [load]);

  const toggleScope = (s: ApiScope) => setScopes((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]);

  async function create() {
    if (!name.trim() || scopes.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch(withBase("/api/api-keys"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), scopes }) });
      const json = await res.json();
      if (json.ok) { setFresh(json.plaintext); setName(""); setAdding(false); await load(); }
    } finally { setBusy(false); }
  }
  async function revoke(k: ApiKey) {
    if (!window.confirm(`Revoke key "${k.name}"? Anything using it will stop working.`)) return;
    await fetch(withBase(`/api/api-keys/${k.id}`), { method: "DELETE" });
    await load();
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 font-display text-sm font-bold"><KeyRound size={15} className="text-orange-500" /> API keys</h2>
        <button onClick={() => { setAdding((v) => !v); setFresh(null); }} className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:underline">
          {adding ? <X size={12} /> : <Plus size={12} />} {adding ? "Cancel" : "New key"}
        </button>
      </div>

      {fresh && (
        <div className="mt-3 rounded-xl border border-green-300 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/40">
          <p className="text-xs font-bold text-green-800 dark:text-green-300">Copy this key now — it won&apos;t be shown again.</p>
          <div className="mt-1.5 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-white px-2 py-1 font-mono text-xs dark:bg-stone-900">{fresh}</code>
            <button onClick={() => navigator.clipboard?.writeText(fresh)} className="rounded-lg border border-stone-300 p-1.5 text-stone-500 hover:text-orange-600 dark:border-stone-700" aria-label="Copy"><Copy size={13} /></button>
          </div>
        </div>
      )}

      {adding && (
        <div className="mt-3 space-y-2 rounded-xl border border-stone-200 bg-stone-50/60 p-3 dark:border-stone-800 dark:bg-stone-950/40">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Key name (e.g. n8n integration)" className={`${inputCls} w-full`} />
          <div className="flex flex-wrap gap-2">
            {API_SCOPES.map((s) => (
              <button key={s} type="button" onClick={() => toggleScope(s)} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${scopes.includes(s) ? "border-orange-500 bg-orange-500 text-white" : "border-stone-300 text-stone-500 dark:border-stone-700"}`}>{SCOPE_LABEL[s]}</button>
            ))}
          </div>
          <button onClick={() => void create()} disabled={busy || !name.trim() || !scopes.length} className="rounded-lg bg-orange-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-500 disabled:opacity-50">{busy ? "Creating…" : "Create key"}</button>
        </div>
      )}

      <ul className="mt-3 space-y-2">
        {keys.length === 0 && <li className="text-xs text-stone-400">No API keys yet.</li>}
        {keys.map((k) => (
          <li key={k.id} className={`flex items-center gap-3 rounded-xl border border-stone-200 p-3 dark:border-stone-800 ${k.revokedAt ? "opacity-50" : ""}`}>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-semibold">
                {k.name}
                {k.revokedAt && <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950 dark:text-red-300">Revoked</span>}
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-stone-500">{k.prefix}…&nbsp;·&nbsp;{k.scopes.join(", ")}</p>
              <p className="text-[11px] text-stone-400">{k.lastUsedAt ? `Last used ${new Date(k.lastUsedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : "Never used"}</p>
            </div>
            {!k.revokedAt && <button onClick={() => void revoke(k)} className="rounded-lg border border-stone-300 p-2 text-stone-400 hover:border-red-400 hover:text-red-600 dark:border-stone-700" aria-label="Revoke"><Trash2 size={14} /></button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
