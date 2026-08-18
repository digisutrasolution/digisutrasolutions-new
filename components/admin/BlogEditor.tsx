"use client";

import { withBase } from "@/lib/base-path";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bold, ExternalLink, Eye, Italic, Link2, List, Pencil, Save } from "lucide-react";
import type { PageStatus } from "@prisma/client";
import AiAssist from "@/components/admin/AiAssist";
import BlogBody from "@/components/BlogBody";
import UploadButton from "@/components/admin/UploadButton";
import { BLOG_CATEGORIES, categoryByDb } from "@/lib/blog";

type EditorPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string[];
  authorId: string | null;
  coverUrl: string | null;
  coverWidth: number | null;
  coverHeight: number | null;
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
  canManageAuthors = false,
}: {
  post: EditorPost;
  canPublish: boolean;
  /** authors.manage. The PICKER is always available — crediting an author is
      part of writing — but only someone who may edit profiles is offered the
      link to go and do it. */
  canManageAuthors?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: post.body,
    category: post.category,
    tags: post.tags.join(", "),
    authorId: post.authorId ?? "",
    coverUrl: post.coverUrl ?? "",
    seoTitle: post.seoTitle ?? "",
    seoDescription: post.seoDescription ?? "",
    noIndex: post.noIndex,
  });
  /* The post's stored category when it is not one of the canonical hub values
     — offered back in the select so saving never rewrites it behind the
     author's back. Derived from `form` so it disappears the moment they pick a
     real hub. */
  const legacyCategory =
    form.category && !BLOG_CATEGORIES.some((c) => c.db === form.category)
      ? form.category
      : null;

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  /* The cover's intrinsic size travels with its URL, so the article hero can
     render the image at its own ratio instead of cropping it into a fixed box.
     Kept in its own state rather than in `form` because the two always move
     together and a stale pairing would be worse than none. */
  const [coverDims, setCoverDims] = useState<{ width: number; height: number } | null>(
    post.coverWidth && post.coverHeight
      ? { width: post.coverWidth, height: post.coverHeight }
      : null,
  );

  /* A pasted URL has no MediaAsset row, so the browser measures it: loading
     the image is the only way to learn the shape of something we did not
     store. Debounced, because this fires on every keystroke in the URL box. */
  useEffect(() => {
    const url = form.coverUrl.trim();
    let cancelled = false;
    /* Every path goes through the timeout, including the clear. Calling
       setCoverDims synchronously here trips react-hooks/set-state-in-effect. */
    const t = setTimeout(() => {
      if (!url) { setCoverDims(null); return; }
      const img = new window.Image();
      img.onload = () => {
        if (!cancelled && img.naturalWidth && img.naturalHeight) {
          setCoverDims({ width: img.naturalWidth, height: img.naturalHeight });
        }
      };
      // Unreachable or blocked URL: leave dimensions null and the hero falls
      // back to its fixed box rather than reserving a wrong-shaped space.
      img.onerror = () => { if (!cancelled) setCoverDims(null); };
      img.src = withBase(url);
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [form.coverUrl]);

  /* Active author profiles for the byline picker. Loaded here rather than
     passed in, because adding a profile in another tab should show up on the
     next save without re-rendering the whole editor page. */
  const [authors, setAuthors] = useState<{ id: string; name: string; role: string }[]>([]);
  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch(withBase("/api/authors"));
      const json = await res.json().catch(() => ({ ok: false }));
      if (json.ok) setAuthors(json.authors.filter((a: { isActive: boolean }) => a.isActive));
    }, 0);
    return () => clearTimeout(t);
  }, []);

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
      category: form.category || BLOG_CATEGORIES[0].db,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      authorId: form.authorId || null,
      coverUrl: form.coverUrl || null,
      // Sent together, always: a URL with a stale size is worse than no size.
      coverWidth: form.coverUrl ? (coverDims?.width ?? null) : null,
      coverHeight: form.coverUrl ? (coverDims?.height ?? null) : null,
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
          {/* Published → the real URL. Anything else → the same article page
              behind ?preview=1, which the blog route opens to signed-in team
              members. Authors without blog.publish had no other way to see
              their draft as a finished page. Saved changes only — preview
              reads the stored post, so save first. */}
          <a
            href={withBase(
              post.status === "PUBLISHED"
                ? `/blog/${post.slug}`
                : `/blog/${post.slug}?preview=1`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 transition-colors hover:border-orange-500 hover:text-orange-700 dark:border-stone-700 dark:text-stone-300"
          >
            <ExternalLink size={13} aria-hidden />{" "}
            {post.status === "PUBLISHED" ? "View live" : "Preview draft"}
          </a>
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
              {/* A select, not free text. The old input is exactly how posts
                  ended up filed as "Performance Marketing" and "SEO Tools" —
                  values no hub matched, which left them uncounted AND
                  unreachable from hub navigation. */}
              <select
                id="be-category"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className={inputCls}
              >
                {BLOG_CATEGORIES.map((c) => (
                  <option key={c.db} value={c.db}>
                    {c.label}
                  </option>
                ))}
                {/* A legacy value is offered back as-is so opening an old post
                    and saving it cannot silently re-file it. It still lands in
                    the right hub via the alias map — the label says which. */}
                {legacyCategory && (
                  <option value={legacyCategory}>
                    {legacyCategory}
                    {categoryByDb(legacyCategory)
                      ? ` → ${categoryByDb(legacyCategory)!.label}`
                      : " → no hub (fix this)"}
                  </option>
                )}
              </select>
              {legacyCategory && (
                <p className="mt-1 text-[11px] leading-snug text-stone-500">
                  {categoryByDb(legacyCategory)
                    ? `Filed under ${categoryByDb(legacyCategory)!.label}. Pick it from the list above to make that explicit.`
                    : "This category matches no hub, so the post is missing from every topic page. Pick one above."}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="be-tags" className={labelCls}>Tags (comma separated)</label>
              <input id="be-tags" value={form.tags} onChange={(e) => set("tags", e.target.value)} className={inputCls} placeholder="seo, local-seo" />
            </div>
            <div>
              <label htmlFor="be-author" className={labelCls}>Author</label>
              <select
                id="be-author"
                value={form.authorId}
                onChange={(e) => set("authorId", e.target.value)}
                className={inputCls}
              >
                {/* An honest team byline is a real choice, not a blank. Google
                    objects to invented authors, not to an Organization one. */}
                <option value="">DigiSutra growth team (no named author)</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}{a.role ? ` — ${a.role}` : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-stone-400">
                A named author with a photo, bio and LinkedIn is the strongest
                E-E-A-T signal on the page.
                {canManageAuthors && (
                  <>
                    {" "}Manage profiles under{" "}
                    <Link href="/admin/authors" className="font-semibold text-orange-700 hover:underline">
                      Authors
                    </Link>.
                  </>
                )}
              </p>
            </div>
            <div>
              <label htmlFor="be-cover" className={labelCls}>Cover image</label>
              <div className="flex items-center gap-2">
                <input id="be-cover" value={form.coverUrl} onChange={(e) => set("coverUrl", e.target.value)} className={inputCls} placeholder="Paste a URL or upload →" />
                <UploadButton accept="image/*" onUploaded={(url, dims) => { set("coverUrl", url); if (dims) setCoverDims(dims); }} />
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
