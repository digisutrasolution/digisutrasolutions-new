"use client";

import { withBase } from "@/lib/base-path";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  price: string;
  quarterlyPrice: string | null;
  priceUsd: string | null;
  quarterlyPriceUsd: string | null;
  period: string;
  tagline: string;
  marketNote: string | null;
  cta: string;
  featured: boolean;
  order: number;
  visible: boolean;
};
type MatrixRow = { id: string; label: string; tooltip: string | null; values: string[]; order: number; visible: boolean };
type RateRow = { id: string; label: string; price: string; priceUsd: string | null; marketNote: string | null; order: number; visible: boolean };

type Kind = "plan" | "matrix" | "rate";
const TABS: { kind: Kind; label: string }[] = [
  { kind: "plan", label: "Plans" },
  { kind: "matrix", label: "Comparison rows" },
  { kind: "rate", label: "Rate card" },
];

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900 outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100";
const labelCls = "mb-1 block text-xs font-semibold text-stone-500 dark:text-stone-400";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      title={on ? "Visible — click to hide" : "Hidden — click to show"}
      className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${on ? "bg-emerald-600" : "bg-stone-300 dark:bg-stone-700"}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

export default function PricingManager() {
  const [tab, setTab] = useState<Kind>("plan");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [matrix, setMatrix] = useState<MatrixRow[]>([]);
  const [rateCard, setRateCard] = useState<RateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string | boolean>>({});
  const [err, setErr] = useState("");

  const reload = useCallback(async () => {
    const res = await fetch(withBase("/api/pricing"));
    const data = await res.json();
    if (data.ok) {
      setPlans(data.plans);
      setMatrix(data.matrix.map((m: MatrixRow) => ({ ...m, values: (m.values as unknown as string[]) ?? [] })));
      setRateCard(data.rateCard);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void reload(), 0);
    return () => clearTimeout(t);
  }, [reload]);

  const visiblePlans = plans.filter((p) => p.visible);

  const save = async (kind: Kind, id: string | null) => {
    setErr("");
    let payload: object;
    if (kind === "plan") {
      payload = {
        name: draft.name, price: draft.price,
        quarterlyPrice: draft.quarterlyPrice || null,
        priceUsd: draft.priceUsd || null,
        quarterlyPriceUsd: draft.quarterlyPriceUsd || null,
        period: draft.period ?? "/mo", tagline: draft.tagline ?? "",
        marketNote: draft.marketNote || null, cta: draft.cta || "Choose plan",
        featured: Boolean(draft.featured),
      };
    } else if (kind === "matrix") {
      payload = {
        label: draft.label, tooltip: draft.tooltip || null,
        values: visiblePlans.map((_, i) => String(draft[`v${i}`] ?? "")),
      };
    } else {
      payload = { label: draft.label, price: draft.price, priceUsd: draft.priceUsd || null, marketNote: draft.marketNote || null };
    }
    const res = await fetch(
      withBase(id ? `/api/pricing/${id}?kind=${kind}` : "/api/pricing"),
      {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? payload : { kind, data: payload }),
      },
    );
    const data = await res.json();
    if (!data.ok) { setErr(data.error ?? "Save failed."); return; }
    setEditing(null);
    await reload();
  };

  const patch = async (kind: Kind, id: string, body: object) => {
    await fetch(withBase(`/api/pricing/${id}?kind=${kind}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await reload();
  };
  const remove = async (kind: Kind, id: string, label: string) => {
    if (!confirm(`Delete "${label}"?`)) return;
    await fetch(withBase(`/api/pricing/${id}?kind=${kind}`), { method: "DELETE" });
    await reload();
  };

  const openEdit = (id: string, seed: Record<string, string | boolean>) => {
    setEditing(id);
    setDraft(seed);
    setErr("");
  };

  if (loading) return <p className="text-sm text-stone-500">Loading pricing…</p>;

  const form = (kind: Kind, id: string | null) => (
    <div className="mx-2 my-2 rounded-xl border border-orange-200 bg-orange-50/40 p-4 dark:border-orange-900/50 dark:bg-stone-900">
      <div className="grid gap-3 sm:grid-cols-2">
        {kind === "plan" && (
          <>
            <div><label className={labelCls}>Name</label><input value={String(draft.name ?? "")} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>Monthly price</label><input value={String(draft.price ?? "")} onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))} className={inputCls} placeholder="₹19,999" /></div>
              <div><label className={labelCls}>Quarterly price</label><input value={String(draft.quarterlyPrice ?? "")} onChange={(e) => setDraft((p) => ({ ...p, quarterlyPrice: e.target.value }))} className={inputCls} placeholder="₹17,599" /></div>
              <div><label className={labelCls}>Monthly price (USD)</label><input value={String(draft.priceUsd ?? "")} onChange={(e) => setDraft((p) => ({ ...p, priceUsd: e.target.value }))} className={inputCls} placeholder="$249 — blank = auto-convert" /></div>
              <div><label className={labelCls}>Quarterly price (USD)</label><input value={String(draft.quarterlyPriceUsd ?? "")} onChange={(e) => setDraft((p) => ({ ...p, quarterlyPriceUsd: e.target.value }))} className={inputCls} placeholder="$219 — blank = auto-convert" /></div>
            </div>
            <div><label className={labelCls}>Tagline</label><input value={String(draft.tagline ?? "")} onChange={(e) => setDraft((p) => ({ ...p, tagline: e.target.value }))} className={inputCls} /></div>
            <div><label className={labelCls}>Market note</label><input value={String(draft.marketNote ?? "")} onChange={(e) => setDraft((p) => ({ ...p, marketNote: e.target.value }))} className={inputCls} /></div>
            <div><label className={labelCls}>CTA label</label><input value={String(draft.cta ?? "")} onChange={(e) => setDraft((p) => ({ ...p, cta: e.target.value }))} className={inputCls} /></div>
            <label className="flex cursor-pointer items-center gap-2 self-end pb-2 text-xs font-medium text-stone-600 dark:text-stone-300">
              <input type="checkbox" checked={Boolean(draft.featured)} onChange={(e) => setDraft((p) => ({ ...p, featured: e.target.checked }))} />
              Recommended (highlighted column)
            </label>
          </>
        )}
        {kind === "matrix" && (
          <>
            <div><label className={labelCls}>Row label</label><input value={String(draft.label ?? "")} onChange={(e) => setDraft((p) => ({ ...p, label: e.target.value }))} className={inputCls} /></div>
            <div><label className={labelCls}>Tooltip (optional)</label><input value={String(draft.tooltip ?? "")} onChange={(e) => setDraft((p) => ({ ...p, tooltip: e.target.value }))} className={inputCls} /></div>
            {visiblePlans.map((p, i) => (
              <div key={p.id}><label className={labelCls}>{p.name}</label><input value={String(draft[`v${i}`] ?? "")} onChange={(e) => setDraft((d) => ({ ...d, [`v${i}`]: e.target.value }))} className={inputCls} placeholder="✓ / — / text" /></div>
            ))}
          </>
        )}
        {kind === "rate" && (
          <>
            <div><label className={labelCls}>Service</label><input value={String(draft.label ?? "")} onChange={(e) => setDraft((p) => ({ ...p, label: e.target.value }))} className={inputCls} /></div>
            <div><label className={labelCls}>Price</label><input value={String(draft.price ?? "")} onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))} className={inputCls} placeholder="from ₹15,000/mo" /></div>
            <div><label className={labelCls}>Price (USD)</label><input value={String(draft.priceUsd ?? "")} onChange={(e) => setDraft((p) => ({ ...p, priceUsd: e.target.value }))} className={inputCls} placeholder="from $170/mo — blank = auto-convert" /></div>
            <div className="sm:col-span-2"><label className={labelCls}>Market note</label><input value={String(draft.marketNote ?? "")} onChange={(e) => setDraft((p) => ({ ...p, marketNote: e.target.value }))} className={inputCls} /></div>
          </>
        )}
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        {err && <span className="text-xs text-red-600">{err}</span>}
        <button onClick={() => setEditing(null)} className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-stone-500">Cancel</button>
        <button onClick={() => void save(kind, id)} className="cursor-pointer rounded-lg bg-orange-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-orange-700">
          {id ? "Save" : "Add"}
        </button>
      </div>
    </div>
  );

  const list =
    tab === "plan"
      ? plans.map((p) => ({
          id: p.id,
          title: p.name,
          sub: `${p.price}${p.period}${p.quarterlyPrice ? ` · quarterly ${p.quarterlyPrice}` : ""}${p.featured ? " · ★ recommended" : ""}`,
          visible: p.visible,
          seed: { name: p.name, price: p.price, quarterlyPrice: p.quarterlyPrice ?? "", priceUsd: p.priceUsd ?? "", quarterlyPriceUsd: p.quarterlyPriceUsd ?? "", tagline: p.tagline, marketNote: p.marketNote ?? "", cta: p.cta, featured: p.featured } as Record<string, string | boolean>,
        }))
      : tab === "matrix"
        ? matrix.map((m) => ({
            id: m.id,
            title: m.label,
            sub: m.values.join("  ·  "),
            visible: m.visible,
            seed: Object.fromEntries([["label", m.label], ["tooltip", m.tooltip ?? ""], ...m.values.map((v, i) => [`v${i}`, v])]) as Record<string, string | boolean>,
          }))
        : rateCard.map((r) => ({
            id: r.id,
            title: r.label,
            sub: `${r.price}${r.marketNote ? ` · ${r.marketNote}` : ""}`,
            visible: r.visible,
            seed: { label: r.label, price: r.price, priceUsd: r.priceUsd ?? "", marketNote: r.marketNote ?? "" } as Record<string, string | boolean>,
          }));

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-xl bg-stone-100 p-1 dark:bg-stone-800 sm:w-fit">
        {TABS.map((t) => (
          <button
            key={t.kind}
            onClick={() => { setTab(t.kind); setEditing(null); }}
            className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.kind
                ? "bg-white text-stone-900 shadow-sm dark:bg-stone-950 dark:text-stone-100"
                : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-2 dark:border-stone-800 dark:bg-stone-900">
        {list.map((row, i) => (
          <div key={row.id}>
            <div className={`flex items-center gap-2 rounded-lg px-2 py-2 ${!row.visible ? "opacity-50" : ""}`}>
              <div className="flex flex-col">
                <button onClick={() => void patch(tab, row.id, { moveTo: Math.max(0, i - 1) })} disabled={i === 0} className="cursor-pointer text-stone-300 hover:text-orange-600 disabled:opacity-30" aria-label="Move up"><ChevronUp size={12} /></button>
                <button onClick={() => void patch(tab, row.id, { moveTo: i + 1 })} disabled={i === list.length - 1} className="cursor-pointer text-stone-300 hover:text-orange-600 disabled:opacity-30" aria-label="Move down"><ChevronDown size={12} /></button>
              </div>
              <span className="font-semibold text-stone-900 dark:text-stone-100">{row.title}</span>
              <span className="hidden truncate text-xs text-stone-400 md:inline">{row.sub}</span>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => (editing === row.id ? setEditing(null) : openEdit(row.id, row.seed))} className="cursor-pointer text-stone-400 hover:text-orange-600" aria-label="Edit">
                  {editing === row.id ? <X size={14} /> : <Pencil size={14} />}
                </button>
                <button onClick={() => void remove(tab, row.id, row.title)} className="cursor-pointer text-stone-400 hover:text-red-600" aria-label="Delete"><Trash2 size={14} /></button>
                <Toggle on={row.visible} onClick={() => void patch(tab, row.id, { visible: !row.visible })} />
              </div>
            </div>
            {editing === row.id && form(tab, row.id)}
          </div>
        ))}
        {editing === `new:${tab}` ? (
          form(tab, null)
        ) : (
          <button
            onClick={() => openEdit(`new:${tab}`, {})}
            className="mt-1 flex w-full cursor-pointer items-center gap-1.5 rounded-lg border-t border-dashed border-stone-200 px-2 pb-1 pt-2.5 text-xs font-semibold text-orange-700 hover:bg-orange-50 dark:border-stone-800 dark:hover:bg-stone-800"
          >
            <Plus size={12} /> Add {tab === "plan" ? "plan" : tab === "matrix" ? "comparison row" : "rate row"}
          </button>
        )}
      </div>
      {tab === "matrix" && (
        <p className="mt-2 text-xs text-stone-400">
          Each comparison row holds one value per visible plan, in plan order: {visiblePlans.map((p) => p.name).join(" → ")}.
        </p>
      )}
    </div>
  );
}
