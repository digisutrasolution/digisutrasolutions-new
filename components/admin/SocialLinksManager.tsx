"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";

type SocialLink = { key: string; label: string; followers?: string; url: string };

const PLATFORMS = [
  { key: "whatsapp", label: "WhatsApp channel" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
  { key: "facebook", label: "Facebook" },
  { key: "x", label: "X (Twitter)" },
  { key: "pinterest", label: "Pinterest" },
];

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

export default function SocialLinksManager({ initial }: { initial: SocialLink[] }) {
  const [links, setLinks] = useState<SocialLink[]>(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const update = (i: number, patch: Partial<SocialLink>) =>
    setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const addRow = () => {
    const used = new Set(links.map((l) => l.key));
    const next = PLATFORMS.find((p) => !used.has(p.key));
    if (!next) return;
    setLinks((prev) => [...prev, { key: next.key, label: next.label, url: "" }]);
  };

  async function save() {
    setState("saving");
    setError(null);
    try {
      const res = await fetch(withBase("/api/settings/social"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
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
      <div className="space-y-3">
        {links.length === 0 && (
          <p className="py-6 text-center text-sm text-stone-500">
            No social profiles configured — the public card is hidden.
          </p>
        )}
        {links.map((link, i) => (
          <div
            key={`${link.key}-${i}`}
            className="grid grid-cols-1 gap-2 rounded-xl border border-stone-100 p-3 sm:grid-cols-[150px_1fr_120px_1.4fr_auto] sm:items-center dark:border-stone-800"
          >
            <select
              value={link.key}
              onChange={(e) => {
                const p = PLATFORMS.find((x) => x.key === e.target.value);
                update(i, { key: e.target.value, label: p?.label ?? e.target.value });
              }}
              aria-label="Platform"
              className={inputCls}
            >
              {PLATFORMS.map((p) => (
                <option
                  key={p.key}
                  value={p.key}
                  disabled={p.key !== link.key && links.some((l) => l.key === p.key)}
                >
                  {p.label}
                </option>
              ))}
            </select>
            <input
              value={link.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Display label"
              aria-label="Label"
              className={inputCls}
            />
            <input
              value={link.followers ?? ""}
              onChange={(e) => update(i, { followers: e.target.value })}
              placeholder="2.4k followers"
              aria-label="Follower count (optional)"
              className={inputCls}
            />
            <input
              value={link.url}
              onChange={(e) => update(i, { url: e.target.value })}
              placeholder="https://…"
              aria-label="Profile URL"
              className={inputCls}
            />
            <button
              onClick={() => setLinks((prev) => prev.filter((_, idx) => idx !== i))}
              aria-label={`Remove ${link.label}`}
              className="cursor-pointer justify-self-end rounded-lg p-1.5 text-stone-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-stone-800"
            >
              <Trash2 size={14} aria-hidden />
            </button>
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={addRow}
          disabled={links.length >= PLATFORMS.length}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          <Plus size={14} aria-hidden /> Add profile
        </button>
        <button
          onClick={() => void save()}
          disabled={state === "saving"}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-500 disabled:opacity-60"
        >
          <Save size={14} aria-hidden />
          {state === "saving" ? "Saving…" : state === "saved" ? "Saved ✓" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
