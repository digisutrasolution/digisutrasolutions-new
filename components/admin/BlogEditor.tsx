"use client";

import { withBase } from "@/lib/base-path";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bold, ExternalLink, Eye, Italic, Link2, List, Pencil, Save } from "lucide-react";
import type { PageStatus } from "@prisma/client";
import AiAssist from "@/components/admin/AiAssist";
import BlogBody from "@/components/BlogBody";
import UploadButton from "@/components/admin/UploadButton";

type EditorPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string[];
  coverUrl: string | null;
  status: PageStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  noIndex: boolean;
  readingMinutes: number;
};

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
const labelCls = "mb-1 block text-xs font-semibold";
const cardCls =
  "rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900";

const STATUS_STYLE: Record<PageStatus, string> = {
  DRAFT: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
  SCHEDULED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  ARCHIVED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

/** A single body-toolbar button. */
function TB({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="flex h-7 min-w-7 cursor-pointer items-center justify-center rounded px-2 text-xs font-bold text-stone-600 transition-colors hover:bg-white hover:text-orange-700 dark:text-stone-300 dark:hover:bg-stone-800"
    >
      {children}
    </button>
  );
}

export default function BlogEditor({
  post,
  canPublish,
}: {
  post: EditorPost;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: post.body,
    category: post.category,
    tags: post.tags.join(", "),
    coverUrl: post.coverUrl ?? "",
    seoTitle: post.seoTitle ?? "",
    seoDescription: post.seoDescription ?? "",
    noIndex: post.noIndex,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  // Wrap the selection (bold/italic/link) and keep the caret sensible.
  function surround(before: string, after: string, placeholder: string) {
    const ta = bodyRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const sel = value.slice(s, e) || placeholder;
    set("body", value.slice(0, s) + before + sel + after + value.slice(e));
    requestAnimationFrame(() => {
      ta.focus();
      const pos = s + before.length + sel.length + after.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  // Prefix the current line (headings, list items).
  function linePrefix(prefix: string) {
    const ta = bodyRef.current;
    if (!ta) return;
    const { selectionStart: s, value } = ta;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    set("body", value.slice(0, lineStart) + prefix + value.slice(lineStart));
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + prefix.length, s + prefix.length);
    });
  }

  function insertImage(url: string) {
    const ta = bodyRef.current;
    const s = ta?.selectionStart ?? form.body.length;
    const md = `\n\n![](${url})\n\n`;
    set("body", form.body.slice(0, s) + md + form.body.slice(s));
  }

  async function api(path: string, body: unknown, method = "PATCH") {
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch(withBase(path), {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setMessage({ kind: "err", text: json.error ?? "Request failed." });
        return null;
      }
      return json;
    } catch {
      setMessage({ kind: "err", text: "Network error." });
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const json = await api(`/api/posts/${post.id}`, {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      body: form.body,
      category: form.category || "General",
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      coverUrl: form.coverUrl || null,
      seoTitle: form.seoTitle || null,
      seoDescription: form.seoDescription || null,
      noIndex: form.noIndex,
    });
    if (json) {
      setMessage({ kind: "ok", text: "Saved." });
      router.refresh();
    }
  }

  async function publishAction(action: string) {
    const json = await api(`/api/posts/${post.id}/publish`, { action }, "POST");
    if (json) {
      setMessage({ kind: "ok", text: `Post ${action}ed.` });
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blog"
            aria-label="Back to blog"
            className="rounded-lg p-2 text-stone-500 transition-colors hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-stone-800"
          >
            <ArrowLeft size={16} aria-hidden />
          </Link>
          <div>
            <h1 className="font-display text-xl font-extrabold tracking-tight">
              {form.title || "Untitled article"}
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              /blog/{form.slug} · {post.readingMinutes} min read
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[post.status]}`}>
            {post.status.charAt(0) + post.status.slice(1).toLowerCase()}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {post.status === "PUBLISHED" && (
            <a
              href={`/blog/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 transition-colors hover:border-orange-500 hover:text-orange-700 dark:border-stone-700 dark:text-stone-300"
            >
              <ExternalLink size={13} aria-hidden /> View live
            </a>
          )}
          {canPublish &&
            (post.status !== "PUBLISHED" ? (
              <button
                onClick={() => void publishAction("publish")}
                disabled={busy}
                className="cursor-pointer rounded-full bg-green-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-500"
              >
                Publish
              </button>
            ) : (
              <button
                onClick={() => void publishAction("unpublish")}
                disabled={busy}
                className="cursor-pointer rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 transition-colors hover:border-orange-500 dark:border-stone-700 dark:text-stone-300"
              >
                Unpublish
              </button>
            ))}
          <button
            onClick={() => void save()}
            disabled={busy}
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-orange-600 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-500 disabled:opacity-60"
          >
            <Save size={13} aria-hidden /> {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {message && (
        <p
          role={message.kind === "err" ? "alert" : "status"}
          className={`mt-3 text-sm font-medium ${message.kind === "err" ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}
        >
          {message.text}
        </p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className={`${cardCls} space-y-3`}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="be-title" className={labelCls}>Title</label>
                <input id="be-title" value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="be-slug" className={labelCls}>Slug</label>
                <input id="be-slug" value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} className={inputCls} />
              </div>
            </div>
            <div>
              <label htmlFor="be-excerpt" className={labelCls}>Excerpt</label>
              <textarea id="be-excerpt" rows={2} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} className={inputCls} />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="be-body" className={labelCls}>Body</label>
                <button type="button" onClick={() => setPreview((v) => !v)} className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline">
                  {preview ? <><Pencil size={12} /> Write</> : <><Eye size={12} /> Preview</>}
                </button>
              </div>
              {preview ? (
                <div className="min-h-[24rem] rounded-xl border border-stone-300 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
                  {form.body.trim() ? <BlogBody body={form.body} /> : <p className="text-sm text-stone-400">Nothing to preview yet.</p>}
                </div>
              ) : (
                <>
                  <div className="mb-1.5 flex flex-wrap items-center gap-0.5 rounded-lg border border-stone-200 bg-stone-50 p-1 dark:border-stone-800 dark:bg-stone-900/50">
                    <TB onClick={() => linePrefix("## ")}>H2</TB>
                    <TB onClick={() => linePrefix("### ")}>H3</TB>
                    <TB onClick={() => surround("**", "**", "bold text")} title="Bold"><Bold size={13} /></TB>
                    <TB onClick={() => surround("*", "*", "italic")} title="Italic"><Italic size={13} /></TB>
                    <TB onClick={() => linePrefix("- ")} title="Bullet list"><List size={13} /></TB>
                    <TB onClick={() => surround("[", "](https://)", "link text")} title="Link"><Link2 size={13} /></TB>
                    <UploadButton accept="image/*" label="Image" onUploaded={insertImage} className="border-none bg-transparent px-2 py-1 hover:bg-white dark:hover:bg-stone-800" />
                  </div>
                  <textarea ref={bodyRef} id="be-body" rows={18} value={form.body} onChange={(e) => set("body", e.target.value)} className={`${inputCls} font-mono text-xs leading-relaxed`} />
                  <p className="mt-1 text-[11px] text-stone-400">
                    Markdown: **bold**, *italic*, [link](url), “- ” lists, “## / ### ” headings, ![alt](url) images.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`${cardCls} space-y-3`}>
            <div>
              <label htmlFor="be-category" className={labelCls}>Category</label>
              <input id="be-category" value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="be-tags" className={labelCls}>Tags (comma separated)</label>
              <input id="be-tags" value={form.tags} onChange={(e) => set("tags", e.target.value)} className={inputCls} placeholder="seo, local-seo" />
            </div>
            <div>
              <label htmlFor="be-cover" className={labelCls}>Cover image</label>
              <div className="flex items-center gap-2">
                <input id="be-cover" value={form.coverUrl} onChange={(e) => set("coverUrl", e.target.value)} className={inputCls} placeholder="Paste a URL or upload →" />
                <UploadButton accept="image/*" onUploaded={(url) => set("coverUrl", url)} />
              </div>
              {form.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={withBase(form.coverUrl)} alt="" className="mt-2 h-24 w-full rounded-lg object-cover" />
              )}
            </div>
          </div>

          <div className={`${cardCls} space-y-3`}>
            <p className="font-display text-sm font-bold">SEO</p>
            <div>
              <label htmlFor="be-seotitle" className={labelCls}>SEO title</label>
              <input id="be-seotitle" value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} className={inputCls} placeholder={form.title} />
            </div>
            <div>
              <label htmlFor="be-seodesc" className={labelCls}>Meta description</label>
              <textarea id="be-seodesc" rows={3} value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} className={inputCls} />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.noIndex}
                onChange={(e) => set("noIndex", e.target.checked)}
                className="h-4 w-4 accent-orange-600"
              />
              Hide from search engines
            </label>
          </div>

          <AiAssist
            kinds={["blog_outline", "blog_post", "excerpt", "seo_title", "meta_description", "social_caption"]}
            getContext={() => `Title: ${form.title}\nCategory: ${form.category}\n\n${form.body.slice(0, 4000)}`}
            insertLabel="Insert into field"
            onInsert={(kind, text) => {
              if (kind === "blog_outline" || kind === "blog_post") set("body", text);
              else if (kind === "excerpt") set("excerpt", text.slice(0, 500));
              else if (kind === "seo_title") set("seoTitle", text.split("\n")[0].slice(0, 200));
              else if (kind === "meta_description") set("seoDescription", text.split("\n")[0].slice(0, 400));
            }}
          />
        </div>
      </div>
    </div>
  );
}
