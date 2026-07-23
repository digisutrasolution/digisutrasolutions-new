"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, FilePlus2, Pencil } from "lucide-react";
import type { PageStatus } from "@prisma/client";
import { useAdminList, AdminSearch, AdminPager } from "@/components/admin/useAdminList";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: PageStatus;
  publishedAt: string | null;
  updatedAt: string;
  authorName: string | null;
};

const STATUS_STYLE: Record<PageStatus, string> = {
  DRAFT: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
  SCHEDULED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  ARCHIVED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function BlogList({
  posts,
  canPublish,
}: {
  posts: PostRow[];
  canPublish: boolean;
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { query, setQuery, page, setPage, pageItems, total, grandTotal, totalPages, pageSize } =
    useAdminList(
      posts,
      (p) => `${p.title} ${p.slug} ${p.category} ${p.status} ${p.authorName ?? ""}`,
    );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(withBase("/api/posts"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not create the post.");
        return;
      }
      router.push(`/admin/blog/${json.post.id}`);
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function publishToggle(post: PostRow) {
    setBusy(true);
    const action = post.status === "PUBLISHED" ? "unpublish" : "publish";
    const res = await fetch(withBase(`/api/posts/${post.id}/publish`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok || !json.ok) {
      setError(json.error ?? "Action failed.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex cursor-pointer items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-500"
        >
          <FilePlus2 size={15} aria-hidden />
          {showCreate ? "Close" : "New article"}
        </button>
        {error && (
          <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-[1fr_1fr_auto] dark:border-stone-800 dark:bg-stone-900"
        >
          <div>
            <label htmlFor="post-title" className="mb-1 block text-xs font-semibold">Title</label>
            <input
              id="post-title"
              required
              minLength={2}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSlug(slugify(e.target.value));
              }}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="post-slug" className="mb-1 block text-xs font-semibold">Slug</label>
            <input
              id="post-slug"
              required
              minLength={2}
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              className={inputCls}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="self-end cursor-pointer rounded-xl bg-stone-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-60 dark:bg-orange-600"
          >
            Create
          </button>
        </form>
      )}

      <div className="mt-4">
        <AdminSearch
          value={query}
          onChange={setQuery}
          placeholder="Search articles by title, slug, category, status…"
          count={total}
          grandTotal={grandTotal}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500 dark:border-stone-800 dark:text-stone-400">
              <th className="px-5 py-3 font-semibold">Article</th>
              <th className="px-5 py-3 font-semibold">Category</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Updated</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {grandTotal === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-stone-500">
                  No articles yet — create the first one above.
                </td>
              </tr>
            )}
            {grandTotal > 0 && total === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-stone-500">
                  No articles match your search.
                </td>
              </tr>
            )}
            {pageItems.map((p) => (
              <tr key={p.id} className="border-b border-stone-100 last:border-0 dark:border-stone-800">
                <td className="px-5 py-3">
                  <Link href={`/admin/blog/${p.id}`} className="font-medium hover:text-orange-700">
                    {p.title}
                  </Link>
                  <p className="text-xs text-stone-500 dark:text-stone-400">/blog/{p.slug}</p>
                </td>
                <td className="px-5 py-3 text-xs">{p.category}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[p.status]}`}>
                    {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-stone-500 dark:text-stone-400">
                  {new Date(p.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  {p.authorName ? ` · ${p.authorName}` : ""}
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/admin/blog/${p.id}`}
                      aria-label={`Edit ${p.title}`}
                      title="Edit"
                      className="rounded-lg p-2 text-stone-500 transition-colors hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-stone-800"
                    >
                      <Pencil size={15} aria-hidden />
                    </Link>
                    {p.status === "PUBLISHED" && (
                      <a
                        href={`/blog/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View ${p.title}`}
                        title="View live"
                        className="rounded-lg p-2 text-stone-500 transition-colors hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-stone-800"
                      >
                        <ExternalLink size={15} aria-hidden />
                      </a>
                    )}
                    {canPublish && (
                      <button
                        onClick={() => void publishToggle(p)}
                        disabled={busy}
                        className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                          p.status === "PUBLISHED"
                            ? "border border-stone-300 text-stone-700 hover:border-orange-500 dark:border-stone-700 dark:text-stone-300"
                            : "bg-green-600 text-white hover:bg-green-500"
                        }`}
                      >
                        {p.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminPager
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPage={setPage}
        label="posts"
      />
    </div>
  );
}
