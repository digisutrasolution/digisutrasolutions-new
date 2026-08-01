"use client";

import { useState } from "react";
import { Pencil, Save, X, Eye, BookOpen } from "lucide-react";
import { withBase } from "@/lib/base-path";
import BlogBody from "@/components/BlogBody";
import type { GuideDoc } from "@/lib/guide";

export default function GuideView({ initial, canEdit }: { initial: GuideDoc; canEdit: boolean }) {
  const [guide, setGuide] = useState<GuideDoc>(initial);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<GuideDoc>(initial);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");

  async function save() {
    setBusy(true);
    setFlash("");
    try {
      const res = await fetch(withBase("/api/guide"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guide: draft }),
      });
      const json = await res.json();
      if (json.ok) {
        setGuide(json.guide);
        setEditing(false);
        setFlash("Saved.");
      } else setFlash(json.error ?? "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center gap-3">
          <input
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            className="flex-1 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-lg font-bold outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            placeholder="Guide title"
          />
          <button onClick={() => setPreview((v) => !v)} className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-600 hover:border-orange-400 hover:text-orange-600 dark:border-stone-700 dark:text-stone-300">
            <Eye size={14} /> {preview ? "Write" : "Preview"}
          </button>
          <button onClick={() => void save()} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50">
            <Save size={15} /> {busy ? "Saving…" : "Save"}
          </button>
          <button onClick={() => { setDraft(guide); setEditing(false); setPreview(false); }} className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-600 hover:border-red-400 hover:text-red-600 dark:border-stone-700 dark:text-stone-300">
            <X size={14} /> Cancel
          </button>
        </div>
        {preview ? (
          <article className="prose-guide rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900 sm:p-8">
            <BlogBody body={draft.body} />
          </article>
        ) : (
          <textarea
            value={draft.body}
            onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
            rows={30}
            className="w-full rounded-2xl border border-stone-300 bg-white p-4 font-mono text-sm leading-relaxed outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            placeholder="Write the guide in Markdown — ## headings, **bold**, - bullets, [links](url)…"
          />
        )}
        <p className="mt-2 text-[11px] text-stone-400">
          Markdown: <code>## Heading</code>, <code>### Sub-heading</code>, <code>**bold**</code>, <code>*italic*</code>, <code>- bullet</code>, <code>[link](https://…)</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex items-start justify-between gap-3">
        <h1 className="flex items-center gap-2.5 font-display text-3xl font-extrabold tracking-tight">
          <BookOpen size={26} className="text-orange-600" aria-hidden /> {guide.title}
        </h1>
        <div className="flex items-center gap-2">
          {flash && <span className="text-xs font-semibold text-green-600">{flash}</span>}
          {canEdit && (
            <button onClick={() => { setDraft(guide); setEditing(true); }} className="flex items-center gap-1.5 rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500">
              <Pencil size={14} /> Edit
            </button>
          )}
        </div>
      </div>
      <article className="prose-guide rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900 sm:p-9">
        <BlogBody body={guide.body} />
      </article>
    </div>
  );
}
