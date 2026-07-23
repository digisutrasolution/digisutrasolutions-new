"use client";

import { withBase } from "@/lib/base-path";

import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Home, Pencil, Plus, Trash2, X } from "lucide-react";
import { NAV_ICONS, navIcon } from "@/components/nav-icons";
import { useAdminList, AdminSearch, AdminPager } from "@/components/admin/useAdminList";

type Faq = {
  id: string;
  question: string;
  lead: string;
  rest: string;
  category: string;
  icon: string | null;
  featured: boolean;
  order: number;
  visible: boolean;
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

function FaqForm({
  faq,
  categories,
  onSaved,
  onCancel,
}: {
  faq: Partial<Faq>;
  categories: string[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isNew = !faq.id;
  const [f, setF] = useState({
    question: faq.question ?? "",
    lead: faq.lead ?? "",
    rest: faq.rest ?? "",
    category: faq.category ?? "General",
    icon: faq.icon ?? "",
    featured: faq.featured ?? false,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(withBase(isNew ? "/api/faqs" : `/api/faqs/${faq.id}`), {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, icon: f.icon || null }),
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
    <div className="mx-2 mb-2 flex flex-wrap items-end gap-2 rounded-xl border border-orange-200 bg-orange-50/40 p-3 dark:border-orange-900/50 dark:bg-stone-900">
      <div className="basis-full"><label className={labelCls}>Question (phrased as a real search query)</label><input value={f.question} onChange={(e) => setF((p) => ({ ...p, question: e.target.value }))} className={inputCls} maxLength={160} /></div>
      <div className="basis-full"><label className={labelCls}>Lead — the one-sentence direct answer (bolded on site, quoted by AI Overviews)</label><input value={f.lead} onChange={(e) => setF((p) => ({ ...p, lead: e.target.value }))} className={inputCls} maxLength={240} /></div>
      <div className="basis-full"><label className={labelCls}>Supporting detail (1–2 sentences)</label><textarea value={f.rest} onChange={(e) => setF((p) => ({ ...p, rest: e.target.value }))} className={`${inputCls} min-h-16 resize-y`} maxLength={600} /></div>
      <div className="min-w-44 flex-1">
        <label className={labelCls}>Category (groups the /faq page)</label>
        <input list="faq-categories" value={f.category} onChange={(e) => setF((p) => ({ ...p, category: e.target.value }))} className={inputCls} maxLength={50} />
        <datalist id="faq-categories">
          {categories.map((c) => <option key={c} value={c} />)}
        </datalist>
      </div>
      <div className="min-w-36 flex-1">
        <label className={labelCls}>Icon</label>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500 dark:bg-stone-800">
            {createElement(navIcon(f.icon || undefined), { size: 14 })}
          </span>
          <select value={f.icon} onChange={(e) => setF((p) => ({ ...p, icon: e.target.value }))} className={inputCls}>
            <option value="">(default)</option>
            {Object.keys(NAV_ICONS).map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-1.5 pb-2 text-xs font-medium text-stone-600 dark:text-stone-300">
        <input type="checkbox" checked={f.featured} onChange={(e) => setF((p) => ({ ...p, featured: e.target.checked }))} />
        Show on home page
      </label>
      {err && <span className="pb-2 text-xs text-red-600">{err}</span>}
      <button onClick={onCancel} className="cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold text-stone-500">Cancel</button>
      <button onClick={save} disabled={busy || !f.question.trim()} className="cursor-pointer rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50">
        {busy ? "…" : isNew ? "Add" : "Save"}
      </button>
    </div>
  );
}

export default function FaqManager() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch(withBase("/api/faqs"));
    const data = await res.json();
    if (data.ok) setFaqs(data.faqs);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void reload(), 0);
    return () => clearTimeout(t);
  }, [reload]);

  const sorted = useMemo(() => [...faqs].sort((a, b) => a.order - b.order), [faqs]);
  const categories = useMemo(
    () => [...new Set(sorted.map((f) => f.category))],
    [sorted],
  );
  const featuredCount = sorted.filter((f) => f.featured && f.visible).length;

  const { query, setQuery, page, setPage, pageItems, total, grandTotal, totalPages, pageSize } =
    useAdminList(sorted, (f) => `${f.question} ${f.lead} ${f.rest} ${f.category}`);

  const patch = async (id: string, body: object) => {
    await fetch(withBase(`/api/faqs/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await reload();
  };

  if (loading) return <p className="text-sm text-stone-500">Loading FAQs…</p>;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-2 dark:border-stone-800 dark:bg-stone-900">
      <p className="px-2 pb-2 pt-1 text-xs text-stone-400">
        {sorted.length} questions · {featuredCount} on the home page (marked{" "}
        <Home size={11} className="inline text-orange-600" aria-label="home" />)
      </p>
      <div className="px-2">
        <AdminSearch
          value={query}
          onChange={setQuery}
          placeholder="Search questions by text or category…"
          count={total}
          grandTotal={grandTotal}
        />
      </div>
      {grandTotal > 0 && total === 0 && (
        <p className="px-2 py-6 text-center text-xs text-stone-400">No questions match your search.</p>
      )}
      {pageItems.map((f) => {
        const i = sorted.findIndex((s) => s.id === f.id);
        return (
        <div key={f.id}>
          <div className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${!f.visible ? "opacity-50" : ""}`}>
            <div className="flex flex-col">
              <button onClick={() => void patch(f.id, { moveTo: Math.max(0, i - 1) })} disabled={i === 0} className="cursor-pointer text-stone-300 hover:text-orange-600 disabled:opacity-30" aria-label="Move up"><ChevronUp size={12} /></button>
              <button onClick={() => void patch(f.id, { moveTo: i + 1 })} disabled={i === sorted.length - 1} className="cursor-pointer text-stone-300 hover:text-orange-600 disabled:opacity-30" aria-label="Move down"><ChevronDown size={12} /></button>
            </div>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500 dark:bg-stone-800">
              {createElement(navIcon(f.icon ?? undefined), { size: 14 })}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium text-stone-800 dark:text-stone-200">{f.question}</span>
                {f.featured && <Home size={11} className="shrink-0 text-orange-600" aria-label="Shown on home page" />}
              </span>
              <span className="block truncate text-xs text-stone-400">{f.category} · {f.lead}</span>
            </span>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <button onClick={() => setEditing(editing === f.id ? null : f.id)} className="cursor-pointer text-stone-400 hover:text-orange-600" aria-label="Edit">
                {editing === f.id ? <X size={14} /> : <Pencil size={14} />}
              </button>
              <button
                onClick={() => { if (confirm(`Delete "${f.question}"?`)) void fetch(withBase(`/api/faqs/${f.id}`), { method: "DELETE" }).then(reload); }}
                className="cursor-pointer text-stone-400 hover:text-red-600"
                aria-label="Delete"
              >
                <Trash2 size={14} />
              </button>
              <Toggle on={f.visible} onClick={() => void patch(f.id, { visible: !f.visible })} />
            </div>
          </div>
          {editing === f.id && (
            <FaqForm faq={f} categories={categories} onSaved={() => { setEditing(null); void reload(); }} onCancel={() => setEditing(null)} />
          )}
        </div>
        );
      })}
      <div className="px-2">
        <AdminPager
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPage={setPage}
          label="questions"
        />
      </div>
      {editing === "new" ? (
        <FaqForm faq={{}} categories={categories} onSaved={() => { setEditing(null); void reload(); }} onCancel={() => setEditing(null)} />
      ) : (
        <button onClick={() => setEditing("new")} className="mt-1 flex w-full cursor-pointer items-center gap-1.5 rounded-lg border-t border-dashed border-stone-200 px-2 pb-1 pt-2.5 text-xs font-semibold text-orange-700 hover:bg-orange-50 dark:border-stone-800 dark:hover:bg-stone-800">
          <Plus size={12} /> Add question
        </button>
      )}
    </div>
  );
}
