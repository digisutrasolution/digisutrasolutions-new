"use client";

import { withBase } from "@/lib/base-path";
import { BLOG_CATEGORIES, isOrphanCategory } from "@/lib/blog";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ExternalLink, FilePlus2, Pencil, Trash2, X } from "lucide-react";
import type { PageStatus } from "@prisma/client";
import { useAdminList, AdminSearch } from "@/components/admin/useAdminList";
import AdminPagination from "@/components/admin/AdminPagination";

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
  canDelete,
}: {
  posts: PostRow[];
  canPublish: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState(BLOG_CATEGORIES[0].db);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { query, setQuery, page, setPage, pageItems, total, grandTotal, totalPages, pageSize, setPageSize } =
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
        body: JSON.stringify({ title, slug, category }),
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

  async function act(post: PostRow, action: "publish" | "unpublish" | "archive" | "restore") {
    setBusy(true);
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

  /* Permanent delete — offered only on archived posts, which are already
     retired from the site. The API refuses to delete a PUBLISHED post, so a
     live article can never be removed in one click by mistake. */
  async function remove(post: PostRow) {
    if (
      !window.confirm(
        `Delete "${post.title}" permanently? This cannot be undone — the article and its comments are removed for good.`,
      )
    ) {
      return;
    }
    setError(null);
    setBusy(true);
    const res = await fetch(withBase(`/api/posts/${post.id}`), { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok || !json.ok) {
      setError(json.error ?? "Could not delete the post.");
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
          {showCreate ? <X size={15} aria-hidden /> : <FilePlus2 size={15} aria-hidden />}
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
          className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-[1fr_1fr_minmax(0,0.8fr)_auto] dark:border-stone-800 dark:bg-stone-900"
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
          <div>
            <label htmlFor="post-hub" className="mb-1 block text-xs font-semibold">Topic hub</label>
            {/* Asked for here rather than left to the schema default, which was
                "General" — a value no hub matches, so every new article was
                born missing from every topic page. */}
            <select
              id="post-hub"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputCls}
            >
              {BLOG_CATEGORIES.map((c) => (
                <option key={c.db} value={c.db}>{c.label}</option>
              ))}
            </select>
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
                <td className="px-5 py-3 text-xs">
                  {p.category}
                  {/* An orphaned category is invisible on the site but looks
                      perfectly normal in this column, so it says so here —
                      otherwise you only find out by opening the article. */}
                  {isOrphanCategory(p.category) && (
                    <span
                      title="This category matches no topic hub, so the post is missing from every topic page."
                      className="ml-2 whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    >
                      no hub
                    </span>
                  )}
                </td>
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
                    <a
                      href={withBase(
                        p.status === "PUBLISHED"
                          ? `/blog/${p.slug}`
                          : `/blog/${p.slug}?preview=1`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={
                        p.status === "PUBLISHED"
                          ? `View ${p.title}`
                          : `Preview draft of ${p.title}`
                      }
                      title={p.status === "PUBLISHED" ? "View live" : "Preview draft"}
                      className="rounded-lg p-2 text-stone-500 transition-colors hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-stone-800"
                    >
                      <ExternalLink size={15} aria-hidden />
                    </a>
                    {canPublish && p.status !== "ARCHIVED" && (
                      <button
                        onClick={() => void act(p, p.status === "PUBLISHED" ? "unpublish" : "publish")}
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
                    {canPublish && p.status !== "ARCHIVED" && (
                      <button
                        onClick={() => void act(p, "archive")}
                        disabled={busy}
                        aria-label={`Archive ${p.title}`}
                        title="Archive — retires the post and 301-redirects its URL to the category hub"
                        className="cursor-pointer rounded-lg p-2 text-stone-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-stone-800"
                      >
                        <Archive size={15} aria-hidden />
                      </button>
                    )}
                    {canPublish && p.status === "ARCHIVED" && (
                      <button
                        onClick={() => void act(p, "restore")}
                        disabled={busy}
                        title="Restore to draft"
                        className="cursor-pointer rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:border-orange-500 dark:border-stone-700 dark:text-stone-300"
                      >
                        Restore
                      </button>
                    )}
                    {/* Its own blog.delete permission — grant it per role in
                        Roles & permissions. Only offered once a post is
                        archived, and the API refuses to delete a live one. */}
                    {canDelete && p.status === "ARCHIVED" && (
                      <button
                        onClick={() => void remove(p)}
                        disabled={busy}
                        aria-label={`Delete ${p.title}`}
                        title="Delete permanently — cannot be undone"
                        className="cursor-pointer rounded-lg p-2 text-stone-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-stone-800"
                      >
                        <Trash2 size={15} aria-hidden />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminPagination
        page={page}
        pages={totalPages}
        total={total}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={setPageSize}
        label="posts"
      />
    </div>
  );
}
