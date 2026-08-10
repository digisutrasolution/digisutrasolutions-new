"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, FilePlus2, LayoutTemplate, Pencil } from "lucide-react";
import type { PageKind, PageStatus, WorkflowStage } from "@prisma/client";
import { STAGE_LABELS } from "@/lib/cms/workflow";
import { useAdminList, AdminSearch } from "@/components/admin/useAdminList";
import AdminPagination from "@/components/admin/AdminPagination";

type PageRow = {
  id: string;
  title: string;
  slug: string;
  kind: PageKind;
  status: PageStatus;
  workflowStage: WorkflowStage;
  scheduledAt: string | null;
  updatedAt: string;
  updatedByName: string | null;
  stats: { views: number; leads: number; conversion: number | null };
};

const STATUS_STYLE: Record<PageStatus, string> = {
  DRAFT: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
  SCHEDULED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  ARCHIVED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

/* Landing pages and templates are chips; a plain PAGE gets none, so the list
   stays quiet for the site pages that are the majority. */
const KIND_STYLE: Partial<Record<PageKind, string>> = {
  LANDING: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  TEMPLATE: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
};
const KIND_LABEL: Record<PageKind, string> = {
  PAGE: "Page",
  LANDING: "Landing",
  TEMPLATE: "Template",
};
const KIND_TABS = [
  { value: "ALL", label: "All" },
  { value: "PAGE", label: "Site pages" },
  { value: "LANDING", label: "Landing pages" },
  { value: "TEMPLATE", label: "Templates" },
] as const;

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

/* Views / leads / conversion for one row.

   A template has no public URL, so its zeros would be noise rather than
   information — it gets dashes. A page with no views yet shows a dash for
   conversion too: 0% reads as "converts badly" when the truth is "nobody has
   been there". */
function StatCells({ row }: { row: PageRow }) {
  const cell = "px-4 py-3 text-right text-xs tabular-nums";
  if (row.kind === "TEMPLATE") {
    return (
      <>
        <td className={`${cell} text-stone-300 dark:text-stone-600`}>—</td>
        <td className={`${cell} text-stone-300 dark:text-stone-600`}>—</td>
        <td className={`${cell} text-stone-300 dark:text-stone-600`}>—</td>
      </>
    );
  }
  const { views, leads, conversion } = row.stats;
  return (
    <>
      <td className={`${cell} text-stone-500 dark:text-stone-400`}>
        {views ? views.toLocaleString("en-IN") : <span className="text-stone-300 dark:text-stone-600">0</span>}
      </td>
      <td className={`${cell} ${leads ? "font-semibold text-stone-800 dark:text-stone-100" : "text-stone-300 dark:text-stone-600"}`}>
        {leads ? leads.toLocaleString("en-IN") : "0"}
      </td>
      <td className={cell}>
        {conversion === null ? (
          <span className="text-stone-300 dark:text-stone-600">—</span>
        ) : (
          <span className={conversion > 0 ? "font-semibold text-[#F26419]" : "text-stone-400"}>
            {/* A decimal matters below 10% — 2.3% and 2.9% are different
                pages — but "0.0%" is just noise for a page with no leads. */}
            {conversion === 0 ? "0" : (conversion * 100).toFixed(conversion >= 0.1 ? 0 : 1)}%
          </span>
        )}
      </td>
    </>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function PagesList({
  pages,
  canCreate,
  canPublish,
  statsDays,
}: {
  pages: PageRow[];
  canCreate: boolean;
  canPublish: boolean;
  statsDays: number;
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newKind, setNewKind] = useState<PageKind>("PAGE");
  const [kindTab, setKindTab] = useState<(typeof KIND_TABS)[number]["value"]>("ALL");
  const visible = kindTab === "ALL" ? pages : pages.filter((p) => p.kind === kindTab);

  const { query, setQuery, page, setPage, pageItems, total, grandTotal, totalPages, pageSize, setPageSize } =
    useAdminList(visible, (p) => `${p.title} ${p.slug} ${p.status} ${p.kind}`);

  async function call(path: string, init: RequestInit): Promise<Response | null> {
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
        return null;
      }
      router.refresh();
      return res;
    } catch {
      setError("Network error.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(withBase("/api/pages"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, kind: newKind }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not create the page.");
        return;
      }
      router.push(`/admin/pages/${json.page.id}`);
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        {canCreate ? (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-500"
          >
            <FilePlus2 size={15} aria-hidden />
            {showCreate ? "Close" : "New page"}
          </button>
        ) : (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Read-only view for your role.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-[1fr_1fr_auto_auto] dark:border-stone-800 dark:bg-stone-900"
        >
          <div>
            <label htmlFor="page-title" className="mb-1 block text-xs font-semibold">
              Title
            </label>
            <input
              id="page-title"
              required
              minLength={2}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSlug(slugify(e.target.value));
              }}
              className={inputCls}
              placeholder="Digital Marketing Services"
            />
          </div>
          <div>
            <label htmlFor="page-slug" className="mb-1 block text-xs font-semibold">
              Slug
            </label>
            <input
              id="page-slug"
              required
              minLength={2}
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              className={inputCls}
              placeholder="digital-marketing-services"
            />
          </div>
          <div>
            <label htmlFor="page-kind" className="mb-1 block text-xs font-semibold">
              Kind
            </label>
            <select
              id="page-kind"
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as PageKind)}
              className={inputCls}
            >
              <option value="PAGE">Site page</option>
              <option value="LANDING">Landing page</option>
              <option value="TEMPLATE">Template</option>
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

      <div className="mt-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by page kind">
        {KIND_TABS.map((t) => {
          const n = t.value === "ALL" ? pages.length : pages.filter((p) => p.kind === t.value).length;
          const on = kindTab === t.value;
          return (
            <button
              key={t.value}
              role="tab"
              aria-selected={on}
              onClick={() => {
                setKindTab(t.value);
                setPage(1);
              }}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                on
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-stone-300 text-stone-500 hover:border-orange-400 dark:border-stone-700 dark:text-stone-400"
              }`}
            >
              {t.label}
              <span className={`ml-1.5 tabular-nums ${on ? "text-white/70" : "text-stone-400"}`}>{n}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        <AdminSearch
          value={query}
          onChange={setQuery}
          placeholder="Search pages by title, slug, status…"
          count={total}
          grandTotal={grandTotal}
        />
      </div>

      <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400">
        Views, leads and conversion cover the last {statsDays} days. A lead
        counts against the page the visitor <strong>landed on</strong>, not the
        page they submitted from — so an ad landing page keeps the credit for an
        enquiry finished on the contact page. Spam is excluded.
      </p>

      <div className="mt-2 overflow-x-auto rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500 dark:border-stone-800 dark:text-stone-400">
              <th className="px-5 py-3 font-semibold">Page</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold" title={`Page views in the last ${statsDays} days`}>Views</th>
              <th className="px-4 py-3 text-right font-semibold" title={`Leads whose visit STARTED on this page, last ${statsDays} days`}>Leads</th>
              <th className="px-4 py-3 text-right font-semibold">Conv.</th>
              <th className="px-5 py-3 font-semibold">Updated</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {grandTotal === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-stone-500">
                  No pages yet — create your first page above.
                </td>
              </tr>
            )}
            {grandTotal > 0 && total === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-stone-500">
                  No pages match your search.
                </td>
              </tr>
            )}
            {pageItems.map((p) => (
              <tr key={p.id} className="border-b border-stone-100 last:border-0 dark:border-stone-800">
                <td className="px-5 py-3">
                  <Link href={`/admin/pages/${p.id}`} className="font-medium hover:text-orange-700">
                    {p.title}
                  </Link>
                  <p className="text-xs text-stone-500 dark:text-stone-400">/{p.slug}</p>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {KIND_STYLE[p.kind] && (
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${KIND_STYLE[p.kind]}`}>
                        {KIND_LABEL[p.kind]}
                      </span>
                    )}
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[p.status]}`}>
                      {p.status === "SCHEDULED" && p.scheduledAt
                        ? `Scheduled · ${new Date(p.scheduledAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}`
                        : p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                    </span>
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                      {STAGE_LABELS[p.workflowStage]}
                    </span>
                  </div>
                </td>
                <StatCells row={p} />
                <td className="px-5 py-3 text-xs text-stone-500 dark:text-stone-400">
                  {new Date(p.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  {p.updatedByName ? ` · ${p.updatedByName}` : ""}
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/admin/pages/${p.id}`}
                      aria-label={`Edit ${p.title}`}
                      title="Edit"
                      className="rounded-lg p-2 text-stone-500 transition-colors hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-stone-800"
                    >
                      <Pencil size={15} aria-hidden />
                    </Link>
                    {p.kind !== "TEMPLATE" && (
                    <a
                      href={`/${p.slug}?preview=1`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Preview ${p.title}`}
                      title="Preview"
                      className="rounded-lg p-2 text-stone-500 transition-colors hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-stone-800"
                    >
                      <ExternalLink size={15} aria-hidden />
                    </a>
                    )}
                    {canCreate && (
                      <button
                        onClick={() =>
                          void call(`/api/pages/${p.id}/clone`, {
                            method: "POST",
                            body: JSON.stringify({}),
                          })
                        }
                        disabled={busy}
                        aria-label={`Duplicate ${p.title}`}
                        title="Duplicate"
                        className="cursor-pointer rounded-lg p-2 text-stone-500 transition-colors hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-stone-800"
                      >
                        <Copy size={15} aria-hidden />
                      </button>
                    )}
                    {/* Both directions of the template flow are the same clone
                        call with a different target kind. */}
                    {canCreate && p.kind === "TEMPLATE" && (
                      <button
                        onClick={() =>
                          void call(`/api/pages/${p.id}/clone`, {
                            method: "POST",
                            body: JSON.stringify({ kind: "LANDING" }),
                          })
                        }
                        disabled={busy}
                        className="cursor-pointer rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-500"
                      >
                        Use template
                      </button>
                    )}
                    {canCreate && p.kind !== "TEMPLATE" && (
                      <button
                        onClick={() =>
                          void call(`/api/pages/${p.id}/clone`, {
                            method: "POST",
                            body: JSON.stringify({
                              kind: "TEMPLATE",
                              title: `${p.title} template`,
                            }),
                          })
                        }
                        disabled={busy}
                        aria-label={`Save ${p.title} as a template`}
                        title="Save as template"
                        className="cursor-pointer rounded-lg p-2 text-stone-500 transition-colors hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-stone-800"
                      >
                        <LayoutTemplate size={15} aria-hidden />
                      </button>
                    )}
                    {canPublish && p.status !== "PUBLISHED" && (
                      <button
                        onClick={() =>
                          void call(`/api/pages/${p.id}/publish`, {
                            method: "POST",
                            body: JSON.stringify({ action: "publish" }),
                          })
                        }
                        disabled={busy}
                        className="cursor-pointer rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-500"
                      >
                        Publish
                      </button>
                    )}
                    {canPublish && p.status === "PUBLISHED" && (
                      <button
                        onClick={() =>
                          void call(`/api/pages/${p.id}/publish`, {
                            method: "POST",
                            body: JSON.stringify({ action: "unpublish" }),
                          })
                        }
                        disabled={busy}
                        className="cursor-pointer rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:border-orange-500 hover:text-orange-700 dark:border-stone-700 dark:text-stone-300"
                      >
                        Unpublish
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
        label="pages"
      />
    </div>
  );
}
