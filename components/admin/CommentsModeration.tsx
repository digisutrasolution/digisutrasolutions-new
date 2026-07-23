"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, MessageSquareReply, Star, Trash2, X } from "lucide-react";
import { useAdminList, AdminSearch, AdminPager } from "@/components/admin/useAdminList";

type CommentRow = {
  id: string;
  name: string;
  email: string;
  body: string;
  rating: number | null;
  status: string;
  reply: string | null;
  createdAt: string;
  postTitle: string;
  postSlug: string;
};

const TABS = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "SPAM", label: "Spam" },
];

export default function CommentsModeration({
  comments,
  counts,
}: {
  comments: CommentRow[];
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const [tab, setTab] = useState("PENDING");
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const visible = comments.filter((c) => c.status === tab);

  const { query, setQuery, page, setPage, pageItems, total, grandTotal, totalPages, pageSize } =
    useAdminList(visible, (c) => `${c.name} ${c.email} ${c.body} ${c.postTitle} ${c.postSlug ?? ""}`);

  const switchTab = (key: string) => {
    setTab(key);
    setQuery("");
    setPage(1);
  };

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

  const setStatus = (id: string, status: string) =>
    void api(`/api/comments/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });

  async function saveReply(id: string) {
    const ok = await api(`/api/comments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ reply: replyText.trim() || null }),
    });
    if (ok) {
      setReplyFor(null);
      setReplyText("");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                : "border border-stone-200 bg-white text-stone-600 hover:border-orange-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
            }`}
          >
            {t.label} ({counts[t.key] ?? 0})
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
      )}

      {grandTotal > 0 && (
        <div className="mt-4">
          <AdminSearch
            value={query}
            onChange={setQuery}
            placeholder="Search reviews by name, text, post…"
            count={total}
            grandTotal={grandTotal}
          />
        </div>
      )}

      <div className="mt-4 space-y-3">
        {grandTotal === 0 && (
          <p className="rounded-2xl border border-stone-200 bg-white px-5 py-10 text-center text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-900">
            Nothing in {TABS.find((t) => t.key === tab)?.label.toLowerCase()}.
          </p>
        )}
        {grandTotal > 0 && total === 0 && (
          <p className="rounded-2xl border border-stone-200 bg-white px-5 py-10 text-center text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-900">
            No reviews match your search.
          </p>
        )}
        {pageItems.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold">
                  {c.name}{" "}
                  <span className="font-normal text-stone-400">· {c.email}</span>
                </p>
                <a
                  href={`/blog/${c.postSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 text-xs text-orange-700 hover:underline"
                >
                  {c.postTitle} <ExternalLink size={10} aria-hidden />
                </a>
              </div>
              <div className="flex items-center gap-3">
                {c.rating != null && (
                  <span className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={12}
                        aria-hidden
                        className={
                          n <= (c.rating ?? 0)
                            ? "fill-orange-500 text-orange-500"
                            : "text-stone-300"
                        }
                      />
                    ))}
                  </span>
                )}
                <span className="text-xs text-stone-400">
                  {new Date(c.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
              {c.body}
            </p>
            {c.reply && (
              <p className="mt-2 rounded-xl bg-orange-50 px-3 py-2 text-xs leading-relaxed text-orange-900 dark:bg-stone-800 dark:text-orange-200">
                <b className="font-semibold">Team reply:</b> {c.reply}
              </p>
            )}

            {replyFor === c.id ? (
              <div className="mt-3">
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Public reply from the team… (saving auto-approves)"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => void saveReply(c.id)}
                    disabled={busy}
                    className="cursor-pointer rounded-xl bg-orange-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-orange-500 disabled:opacity-60"
                  >
                    Save reply
                  </button>
                  <button
                    onClick={() => {
                      setReplyFor(null);
                      setReplyText("");
                    }}
                    className="cursor-pointer rounded-xl border border-stone-200 px-3.5 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {c.status !== "APPROVED" && (
                  <button
                    onClick={() => setStatus(c.id, "APPROVED")}
                    disabled={busy}
                    className="flex cursor-pointer items-center gap-1 rounded-xl bg-green-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-60"
                  >
                    <Check size={12} aria-hidden /> Approve
                  </button>
                )}
                {c.status !== "REJECTED" && (
                  <button
                    onClick={() => setStatus(c.id, "REJECTED")}
                    disabled={busy}
                    className="flex cursor-pointer items-center gap-1 rounded-xl border border-stone-200 px-3.5 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-60 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                  >
                    <X size={12} aria-hidden /> Reject
                  </button>
                )}
                {c.status !== "SPAM" && (
                  <button
                    onClick={() => setStatus(c.id, "SPAM")}
                    disabled={busy}
                    className="cursor-pointer rounded-xl border border-stone-200 px-3.5 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-60 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                  >
                    Spam
                  </button>
                )}
                <button
                  onClick={() => {
                    setReplyFor(c.id);
                    setReplyText(c.reply ?? "");
                  }}
                  disabled={busy}
                  className="flex cursor-pointer items-center gap-1 rounded-xl border border-orange-200 px-3.5 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-60 dark:border-orange-900 dark:hover:bg-stone-800"
                >
                  <MessageSquareReply size={12} aria-hidden /> {c.reply ? "Edit reply" : "Reply"}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete review by ${c.name}?`)) {
                      void api(`/api/comments/${c.id}`, { method: "DELETE" });
                    }
                  }}
                  disabled={busy}
                  aria-label={`Delete review by ${c.name}`}
                  className="ml-auto cursor-pointer rounded-lg p-1.5 text-stone-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-stone-800"
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <AdminPager
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPage={setPage}
        label="reviews"
      />
    </div>
  );
}
