"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Plus, Star, Trash2 } from "lucide-react";
import type { VideoProvider } from "@prisma/client";

type VideoRow = {
  id: string;
  title: string;
  slug: string;
  provider: VideoProvider;
  videoId: string;
  description: string;
  category: string;
  thumbnailUrl: string | null;
  featured: boolean;
  createdAt: string;
};

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function VideosManager({
  videos,
  canManage,
}: {
  videos: VideoRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

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
    const ok = await api("/api/videos", {
      method: "POST",
      body: JSON.stringify({
        title,
        slug,
        url: fd.get("url"),
        description: fd.get("description") || undefined,
        category: fd.get("category") || undefined,
        featured: fd.get("featured") === "on",
      }),
    });
    if (ok) {
      form.reset();
      setTitle("");
      setSlug("");
      setShowCreate(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        {canManage ? (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-500"
          >
            <Plus size={15} aria-hidden />
            {showCreate ? "Close" : "Add video"}
          </button>
        ) : (
          <p className="text-sm text-stone-500 dark:text-stone-400">Read-only view for your role.</p>
        )}
        {error && (
          <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
        )}
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-2 dark:border-stone-800 dark:bg-stone-900"
        >
          <div>
            <label htmlFor="v-title" className="mb-1 block text-xs font-semibold">Title</label>
            <input id="v-title" required minLength={2} value={title} onChange={(e) => { setTitle(e.target.value); setSlug(slugify(e.target.value)); }} className={inputCls} />
          </div>
          <div>
            <label htmlFor="v-slug" className="mb-1 block text-xs font-semibold">Slug (used in Video sections)</label>
            <input id="v-slug" required minLength={2} value={slug} onChange={(e) => setSlug(slugify(e.target.value))} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="v-url" className="mb-1 block text-xs font-semibold">Video URL (YouTube, Vimeo, or .mp4/.webm)</label>
            <input id="v-url" name="url" required placeholder="https://www.youtube.com/watch?v=…" className={inputCls} />
          </div>
          <div>
            <label htmlFor="v-category" className="mb-1 block text-xs font-semibold">Category</label>
            <input id="v-category" name="category" placeholder="Showreel" className={inputCls} />
          </div>
          <div>
            <label htmlFor="v-desc" className="mb-1 block text-xs font-semibold">Description</label>
            <input id="v-desc" name="description" className={inputCls} />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" name="featured" className="h-4 w-4 accent-orange-600" />
            Feature on home page
          </label>
          <button
            type="submit"
            disabled={busy}
            className="cursor-pointer justify-self-end rounded-xl bg-stone-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-60 dark:bg-orange-600"
          >
            Save
          </button>
        </form>
      )}

      {videos.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-stone-300 py-16 text-center text-sm text-stone-500 dark:border-stone-700">
          No videos yet — add your first one.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <div key={v.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
              {v.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.thumbnailUrl} alt="" loading="lazy" className="aspect-video w-full bg-stone-100 object-cover dark:bg-stone-800" />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-stone-100 text-xs text-stone-400 dark:bg-stone-800">
                  {v.provider}
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{v.title}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {v.provider.toLowerCase()} · {v.category} · slug: {v.slug}
                    </p>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => void api(`/api/videos/${v.id}`, { method: "PATCH", body: JSON.stringify({ featured: !v.featured }) })}
                      disabled={busy}
                      aria-label={v.featured ? "Unfeature" : "Feature on home"}
                      title={v.featured ? "Featured on home — click to remove" : "Feature on home"}
                      className={`cursor-pointer rounded-lg p-1.5 transition-colors ${v.featured ? "text-orange-500" : "text-stone-300 hover:text-orange-400"}`}
                    >
                      <Star size={16} fill={v.featured ? "currentColor" : "none"} aria-hidden />
                    </button>
                  )}
                </div>
                <div className="mt-3 flex justify-end gap-1">
                  <button
                    onClick={() => {
                      void navigator.clipboard.writeText(v.slug).then(() => {
                        setCopied(v.id);
                        setTimeout(() => setCopied(null), 1500);
                      });
                    }}
                    aria-label={`Copy slug for ${v.title}`}
                    title="Copy slug"
                    className="cursor-pointer rounded-lg p-1.5 text-stone-500 hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-stone-800"
                  >
                    {copied === v.id ? <span className="text-[10px] font-bold text-green-600">✓</span> : <Copy size={14} aria-hidden />}
                  </button>
                  {canManage && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${v.title}"? Pages embedding it will show nothing.`)) {
                          void api(`/api/videos/${v.id}`, { method: "DELETE" });
                        }
                      }}
                      disabled={busy}
                      aria-label={`Delete ${v.title}`}
                      title="Delete"
                      className="cursor-pointer rounded-lg p-1.5 text-stone-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-stone-800"
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
