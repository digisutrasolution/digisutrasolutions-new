"use client";

import { withBase } from "@/lib/base-path";

import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { NAV_ICONS, navIcon } from "@/components/nav-icons";

type Offer = {
  id: string;
  categoryId: string;
  name: string;
  blurb: string;
  highlight: boolean;
  order: number;
  visible: boolean;
};

type Category = {
  id: string;
  slug: string;
  name: string;
  blurb: string;
  intro: string;
  icon: string | null;
  badge: string | null;
  image: string | null;
  stat: string | null;
  statLabel: string | null;
  priceFrom: string | null;
  marketNote: string | null;
  order: number;
  visible: boolean;
  offers: Offer[];
};

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900 outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100";
const labelCls = "mb-1 block text-xs font-semibold text-stone-500 dark:text-stone-400";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      title={on ? "Visible — click to hide" : "Hidden — click to show"}
      className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
        on ? "bg-emerald-600" : "bg-stone-300 dark:bg-stone-700"
      }`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

function CategoryForm({
  category,
  onSaved,
  onCancel,
}: {
  category: Partial<Category>;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isNew = !category.id;
  const [f, setF] = useState({
    slug: category.slug ?? "",
    name: category.name ?? "",
    blurb: category.blurb ?? "",
    intro: category.intro ?? "",
    icon: category.icon ?? "",
    badge: category.badge ?? "",
    image: category.image ?? "",
    stat: category.stat ?? "",
    statLabel: category.statLabel ?? "",
    priceFrom: category.priceFrom ?? "",
    marketNote: category.marketNote ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(withBase(isNew ? "/api/services" : `/api/services/${category.id}`), {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: f.slug,
          name: f.name,
          blurb: f.blurb,
          intro: f.intro,
          icon: f.icon || null,
          badge: f.badge || null,
          image: f.image || null,
          stat: f.stat || null,
          statLabel: f.statLabel || null,
          priceFrom: f.priceFrom || null,
          marketNote: f.marketNote || null,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-2 mb-2 rounded-xl border border-orange-200 bg-orange-50/40 p-4 dark:border-orange-900/50 dark:bg-stone-900">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className={labelCls}>Name</label><input value={f.name} onChange={(e) => set("name", e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>Slug (URL)</label><input value={f.slug} onChange={(e) => set("slug", e.target.value)} className={inputCls} placeholder="seo-ai-search" /></div>
        <div className="sm:col-span-2"><label className={labelCls}>Blurb (cards/menus)</label><input value={f.blurb} onChange={(e) => set("blurb", e.target.value)} className={inputCls} maxLength={160} /></div>
        <div className="sm:col-span-2"><label className={labelCls}>Intro (category page)</label><textarea value={f.intro} onChange={(e) => set("intro", e.target.value)} className={`${inputCls} min-h-20`} maxLength={600} /></div>
        <div>
          <label className={labelCls}>Icon</label>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500 dark:bg-stone-800">
              {createElement(navIcon(f.icon || undefined), { size: 16 })}
            </span>
            <select value={f.icon} onChange={(e) => set("icon", e.target.value)} className={inputCls}>
              <option value="">— none —</option>
              {Object.keys(NAV_ICONS).map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>
        <div><label className={labelCls}>Badge</label><input value={f.badge} onChange={(e) => set("badge", e.target.value)} className={inputCls} placeholder="NEW / AEO · GEO" maxLength={20} /></div>
        <div><label className={labelCls}>Image (hero/card)</label><input value={f.image} onChange={(e) => set("image", e.target.value)} className={inputCls} placeholder="/services-pages/… or /uploads/…" /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={labelCls}>Stat</label><input value={f.stat} onChange={(e) => set("stat", e.target.value)} className={inputCls} placeholder="+214%" maxLength={20} /></div>
          <div><label className={labelCls}>Stat label</label><input value={f.statLabel} onChange={(e) => set("statLabel", e.target.value)} className={inputCls} maxLength={60} /></div>
        </div>
        <div><label className={labelCls}>Price from</label><input value={f.priceFrom} onChange={(e) => set("priceFrom", e.target.value)} className={inputCls} placeholder="from ₹15,000/mo" maxLength={60} /></div>
        <div><label className={labelCls}>Market note</label><input value={f.marketNote} onChange={(e) => set("marketNote", e.target.value)} className={inputCls} placeholder="market: ₹20k–50k/mo" maxLength={80} /></div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        {err && <span className="text-xs text-red-600">{err}</span>}
        <button onClick={onCancel} className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200">Cancel</button>
        <button onClick={save} disabled={busy || !f.name.trim() || !f.slug.trim()} className="cursor-pointer rounded-lg bg-orange-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50">
          {busy ? "Saving…" : isNew ? "Add service" : "Save"}
        </button>
      </div>
    </div>
  );
}

function OfferForm({
  offer,
  categoryId,
  onSaved,
  onCancel,
}: {
  offer: Partial<Offer>;
  categoryId: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isNew = !offer.id;
  const [f, setF] = useState({
    name: offer.name ?? "",
    blurb: offer.blurb ?? "",
    highlight: offer.highlight ?? false,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(
        withBase(isNew ? `/api/services/${categoryId}/offers` : `/api/services/offers/${offer.id}`),
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(f),
        },
      );
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-2 mb-2 flex flex-wrap items-end gap-2 rounded-xl border border-orange-200 bg-orange-50/40 p-3 dark:border-orange-900/50 dark:bg-stone-900">
      <div className="min-w-40 flex-1"><label className={labelCls}>Offer</label><input value={f.name} onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))} className={inputCls} /></div>
      <div className="min-w-52 flex-[2]"><label className={labelCls}>One-line blurb</label><input value={f.blurb} onChange={(e) => setF((p) => ({ ...p, blurb: e.target.value }))} className={inputCls} maxLength={120} /></div>
      <label className="flex cursor-pointer items-center gap-1.5 pb-2 text-xs font-medium text-stone-600 dark:text-stone-300">
        <input type="checkbox" checked={f.highlight} onChange={(e) => setF((p) => ({ ...p, highlight: e.target.checked }))} />
        Highlight
      </label>
      {err && <span className="pb-2 text-xs text-red-600">{err}</span>}
      <button onClick={onCancel} className="cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold text-stone-500">Cancel</button>
      <button onClick={save} disabled={busy || !f.name.trim()} className="cursor-pointer rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50">
        {busy ? "…" : isNew ? "Add" : "Save"}
      </button>
    </div>
  );
}

export default function ServicesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch(withBase("/api/services"));
    const data = await res.json();
    if (data.ok) setCategories(data.categories);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void reload(), 0);
    return () => clearTimeout(t);
  }, [reload]);

  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories],
  );

  const patchCat = async (id: string, body: object) => {
    await fetch(withBase(`/api/services/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await reload();
  };
  const patchOffer = async (id: string, body: object) => {
    await fetch(withBase(`/api/services/offers/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await reload();
  };

  if (loading) return <p className="text-sm text-stone-500">Loading services…</p>;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-2 dark:border-stone-800 dark:bg-stone-900">
      {sorted.map((cat, ci) => {
        const isOpen = expanded.has(cat.id);
        return (
          <div key={cat.id}>
            <div className={`flex items-center gap-2 rounded-lg px-2 py-2 ${!cat.visible ? "opacity-50" : ""}`}>
              <div className="flex flex-col">
                <button onClick={() => void patchCat(cat.id, { moveTo: Math.max(0, ci - 1) })} disabled={ci === 0} className="cursor-pointer text-stone-300 hover:text-orange-600 disabled:opacity-30" aria-label="Move up"><ChevronUp size={12} /></button>
                <button onClick={() => void patchCat(cat.id, { moveTo: ci + 1 })} disabled={ci === sorted.length - 1} className="cursor-pointer text-stone-300 hover:text-orange-600 disabled:opacity-30" aria-label="Move down"><ChevronDown size={12} /></button>
              </div>
              <button
                onClick={() => setExpanded((s) => { const n = new Set(s); if (n.has(cat.id)) n.delete(cat.id); else n.add(cat.id); return n; })}
                className="cursor-pointer text-stone-400"
                aria-label={isOpen ? "Collapse" : "Expand"}
              >
                {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500 dark:bg-stone-800">
                {createElement(navIcon(cat.icon ?? undefined), { size: 14 })}
              </span>
              <span className="font-semibold text-stone-900 dark:text-stone-100">{cat.name}</span>
              {cat.badge && <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-900 dark:bg-orange-900/40 dark:text-orange-200">{cat.badge}</span>}
              <span className="hidden text-xs text-stone-400 lg:inline">/services/{cat.slug} · {cat.offers.length} offers{cat.priceFrom ? ` · ${cat.priceFrom}` : ""}</span>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => setEditing(editing === cat.id ? null : cat.id)} className="cursor-pointer text-stone-400 hover:text-orange-600" aria-label="Edit">
                  {editing === cat.id ? <X size={14} /> : <Pencil size={14} />}
                </button>
                <button
                  onClick={() => { if (confirm(`Delete "${cat.name}" and its ${cat.offers.length} offers?`)) void fetch(withBase(`/api/services/${cat.id}`), { method: "DELETE" }).then(reload); }}
                  className="cursor-pointer text-stone-400 hover:text-red-600"
                  aria-label="Delete"
                >
                  <Trash2 size={14} />
                </button>
                <Toggle on={cat.visible} onClick={() => void patchCat(cat.id, { visible: !cat.visible })} />
              </div>
            </div>
            {editing === cat.id && (
              <CategoryForm category={cat} onSaved={() => { setEditing(null); void reload(); }} onCancel={() => setEditing(null)} />
            )}
            {isOpen && (
              <div className="mb-1 ml-10 border-l border-stone-100 pl-2 dark:border-stone-800">
                {cat.offers.map((o, oi) => (
                  <div key={o.id}>
                    <div className={`flex items-center gap-2 rounded-lg px-2 py-1 ${!o.visible ? "opacity-50" : ""}`}>
                      <div className="flex flex-col">
                        <button onClick={() => void patchOffer(o.id, { moveTo: Math.max(0, oi - 1) })} disabled={oi === 0} className="cursor-pointer text-stone-300 hover:text-orange-600 disabled:opacity-30" aria-label="Move up"><ChevronUp size={11} /></button>
                        <button onClick={() => void patchOffer(o.id, { moveTo: oi + 1 })} disabled={oi === cat.offers.length - 1} className="cursor-pointer text-stone-300 hover:text-orange-600 disabled:opacity-30" aria-label="Move down"><ChevronDown size={11} /></button>
                      </div>
                      <span className={`text-sm font-medium ${o.highlight ? "text-orange-700 dark:text-orange-300" : "text-stone-800 dark:text-stone-200"}`}>{o.name}</span>
                      <span className="hidden truncate text-xs text-stone-400 md:inline">{o.blurb}</span>
                      <div className="ml-auto flex items-center gap-2">
                        <button onClick={() => setEditing(editing === o.id ? null : o.id)} className="cursor-pointer text-stone-400 hover:text-orange-600" aria-label="Edit">
                          {editing === o.id ? <X size={13} /> : <Pencil size={13} />}
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete offer "${o.name}"?`)) void fetch(withBase(`/api/services/offers/${o.id}`), { method: "DELETE" }).then(reload); }}
                          className="cursor-pointer text-stone-400 hover:text-red-600"
                          aria-label="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                        <Toggle on={o.visible} onClick={() => void patchOffer(o.id, { visible: !o.visible })} />
                      </div>
                    </div>
                    {editing === o.id && (
                      <OfferForm offer={o} categoryId={cat.id} onSaved={() => { setEditing(null); void reload(); }} onCancel={() => setEditing(null)} />
                    )}
                  </div>
                ))}
                {editing === `new-offer:${cat.id}` ? (
                  <OfferForm offer={{}} categoryId={cat.id} onSaved={() => { setEditing(null); void reload(); }} onCancel={() => setEditing(null)} />
                ) : (
                  <button onClick={() => setEditing(`new-offer:${cat.id}`)} className="my-1 flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-50 dark:hover:bg-stone-800">
                    <Plus size={12} /> Add offer
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
      {editing === "new-category" ? (
        <CategoryForm category={{}} onSaved={() => { setEditing(null); void reload(); }} onCancel={() => setEditing(null)} />
      ) : (
        <button onClick={() => setEditing("new-category")} className="mt-1 flex w-full cursor-pointer items-center gap-1.5 rounded-lg border-t border-dashed border-stone-200 px-2 pb-1 pt-2.5 text-xs font-semibold text-orange-700 hover:bg-orange-50 dark:border-stone-800 dark:hover:bg-stone-800">
        <Plus size={12} /> Add service category
        </button>
      )}
    </div>
  );
}
