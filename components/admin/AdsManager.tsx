"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

type AdRow = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  targetUrl: string;
  placement: string;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  impressions: number;
  clicks: number;
};

const PLACEMENTS = [
  { value: "BLOG_SIDEBAR", label: "Blog sidebar" },
  { value: "ARTICLE_SIDEBAR", label: "Article sidebar" },
  { value: "BLOG_INLINE", label: "Blog inline (future)" },
  { value: "SERVICE_SIDEBAR", label: "Service page sidebar" },
];

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

export default function AdsManager({ ads }: { ads: AdRow[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function api(path: string, init: RequestInit): Promise<boolean> {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(withBase(path), {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Request failed.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Network error.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const startsAt = fd.get("startsAt") as string;
    const endsAt = fd.get("endsAt") as string;
    const ok = await api("/api/ads", {
      method: "POST",
      body: JSON.stringify({
        title: fd.get("title"),
        description: (fd.get("description") as string) || undefined,
        imageUrl: (fd.get("imageUrl") as string) || undefined,
        targetUrl: fd.get("targetUrl"),
        placement: fd.get("placement"),
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      }),
    });
    if (ok) form.reset();
  }

  return (
    <div>
      <form
        onSubmit={handleCreate}
        className="grid grid-cols-1 gap-3 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3 dark:border-stone-800 dark:bg-stone-900"
      >
        <div>
          <label htmlFor="ad-title" className="mb-1 block text-xs font-semibold">Title</label>
          <input id="ad-title" name="title" required placeholder="Advertise on Smart TV" className={inputCls} />
        </div>
        <div>
          <label htmlFor="ad-desc" className="mb-1 block text-xs font-semibold">Description (optional)</label>
          <input id="ad-desc" name="description" placeholder="Reach 40M+ households…" className={inputCls} />
        </div>
        <div>
          <label htmlFor="ad-placement" className="mb-1 block text-xs font-semibold">Placement</label>
          <select id="ad-placement" name="placement" className={inputCls} defaultValue="BLOG_SIDEBAR">
            {PLACEMENTS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ad-image" className="mb-1 block text-xs font-semibold">Image URL (optional)</label>
          <input id="ad-image" name="imageUrl" placeholder="/uploads/banner.webp — upload via Media" className={inputCls} />
        </div>
        <div>
          <label htmlFor="ad-target" className="mb-1 block text-xs font-semibold">Target URL</label>
          <input id="ad-target" name="targetUrl" required placeholder="/contact or https://…" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="ad-start" className="mb-1 block text-xs font-semibold">Starts (optional)</label>
            <input id="ad-start" name="startsAt" type="date" className={inputCls} />
          </div>
          <div>
            <label htmlFor="ad-end" className="mb-1 block text-xs font-semibold">Ends (optional)</label>
            <input id="ad-end" name="endsAt" type="date" className={inputCls} />
          </div>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            disabled={busy}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-500 disabled:opacity-60"
          >
            <Plus size={14} aria-hidden /> Add banner
          </button>
        </div>
      </form>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500 dark:border-stone-800 dark:text-stone-400">
              <th className="px-5 py-3 font-semibold">Banner</th>
              <th className="px-5 py-3 font-semibold">Placement</th>
              <th className="px-5 py-3 font-semibold">Schedule</th>
              <th className="px-5 py-3 font-semibold">Impr.</th>
              <th className="px-5 py-3 font-semibold">Clicks</th>
              <th className="px-5 py-3 font-semibold">CTR</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ads.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm text-stone-500">
                  No banners yet — the public slots render nothing until one is live.
                </td>
              </tr>
            )}
            {ads.map((a) => (
              <tr key={a.id} className="border-b border-stone-100 last:border-0 dark:border-stone-800">
                <td className="px-5 py-3">
                  <p className="font-semibold">{a.title}</p>
                  <p className="max-w-[220px] truncate font-mono text-xs text-stone-500">{a.targetUrl}</p>
                </td>
                <td className="px-5 py-3 text-xs">
                  {PLACEMENTS.find((p) => p.value === a.placement)?.label ?? a.placement}
                </td>
                <td className="px-5 py-3 text-xs">
                  {a.startsAt || a.endsAt
                    ? `${a.startsAt ? a.startsAt.slice(0, 10) : "…"} → ${a.endsAt ? a.endsAt.slice(0, 10) : "…"}`
                    : "Always"}
                </td>
                <td className="px-5 py-3 text-xs">{a.impressions}</td>
                <td className="px-5 py-3 text-xs">{a.clicks}</td>
                <td className="px-5 py-3 text-xs">
                  {a.impressions > 0 ? `${((a.clicks / a.impressions) * 100).toFixed(1)}%` : "—"}
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => void api(`/api/ads/${a.id}`, { method: "PATCH", body: JSON.stringify({ active: !a.active }) })}
                    disabled={busy}
                    className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      a.active
                        ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-950 dark:text-green-300"
                        : "bg-stone-100 text-stone-500 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400"
                    }`}
                  >
                    {a.active ? "Live" : "Paused"}
                  </button>
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete banner "${a.title}"?`)) {
                          void api(`/api/ads/${a.id}`, { method: "DELETE" });
                        }
                      }}
                      disabled={busy}
                      aria-label={`Delete banner ${a.title}`}
                      className="cursor-pointer rounded-lg p-1.5 text-stone-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-stone-800"
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
