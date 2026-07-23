"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ExternalLink,
  History,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import type { PageStatus, WorkflowStage } from "@prisma/client";
import {
  INDUSTRY_ICON_KEYS,
  SECTION_DEFS,
  defaultSection,
  type Section,
  type SectionType,
} from "@/lib/cms/sections";
import { STAGE_LABELS } from "@/lib/cms/workflow";
import WorkflowPanel from "@/components/admin/WorkflowPanel";
import AiAssist from "@/components/admin/AiAssist";

type EditorPage = {
  id: string;
  title: string;
  slug: string;
  status: PageStatus;
  workflowStage: WorkflowStage;
  sections: Section[];
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  ogImage: string | null;
  noIndex: boolean;
  scheduledAt: string | null;
  publishedAt: string | null;
};

type Permissions = { edit: boolean; seo: boolean; publish: boolean };

type VersionRow = {
  version: number;
  title: string;
  note: string | null;
  createdByName: string | null;
  createdAt: string;
};

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
const labelCls = "mb-1 block text-xs font-semibold";
const cardCls =
  "rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900";

const STATUS_STYLE: Record<PageStatus, string> = {
  DRAFT: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
  SCHEDULED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  ARCHIVED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export default function PageEditor({
  page,
  permissions,
}: {
  page: EditorPage;
  permissions: Permissions;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"content" | "workflow" | "seo" | "versions">(
    "content",
  );
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [sections, setSections] = useState<Section[]>(page.sections);
  const [seo, setSeo] = useState({
    seoTitle: page.seoTitle ?? "",
    seoDescription: page.seoDescription ?? "",
    canonicalUrl: page.canonicalUrl ?? "",
    ogImage: page.ogImage ?? "",
    noIndex: page.noIndex,
  });
  const [addType, setAddType] = useState<SectionType>("hero");
  const [versions, setVersions] = useState<VersionRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function updateSection(index: number, patch: Partial<Section>) {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? ({ ...s, ...patch } as Section) : s)),
    );
  }

  function moveSection(index: number, dir: -1 | 1) {
    setSections((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function api(path: string, init: RequestInit) {
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch(withBase(path), {
        headers: { "Content-Type": "application/json" },
        ...init,
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
    const payload: Record<string, unknown> = {};
    if (permissions.edit) {
      payload.title = title;
      payload.slug = slug;
      payload.sections = sections;
    }
    if (permissions.seo) {
      payload.seoTitle = seo.seoTitle || null;
      payload.seoDescription = seo.seoDescription || null;
      payload.canonicalUrl = seo.canonicalUrl || null;
      payload.ogImage = seo.ogImage || null;
      payload.noIndex = seo.noIndex;
    }
    const json = await api(`/api/pages/${page.id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (json) {
      setMessage({ kind: "ok", text: "Saved." });
      router.refresh();
    }
  }

  async function publishAction(action: string, scheduledAt?: string) {
    let force = false;
    if (
      (action === "publish" || action === "schedule") &&
      page.workflowStage !== "APPROVED"
    ) {
      force = window.confirm(
        `Workflow stage is "${STAGE_LABELS[page.workflowStage]}", not Approved.\n\nForce past the workflow? This override is audit-logged.`,
      );
      if (!force) return;
    }
    const json = await api(`/api/pages/${page.id}/publish`, {
      method: "POST",
      body: JSON.stringify({
        action,
        ...(force ? { force: true } : {}),
        ...(scheduledAt ? { scheduledAt } : {}),
      }),
    });
    if (json) {
      setMessage({ kind: "ok", text: `Page ${action}ed.` });
      router.refresh();
    }
  }

  function schedule() {
    const value = window.prompt(
      "Publish at (YYYY-MM-DD HH:MM, 24h local time):",
    );
    if (!value) return;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      setMessage({ kind: "err", text: "Could not parse that date." });
      return;
    }
    void publishAction("schedule", date.toISOString());
  }

  async function loadVersions() {
    setTab("versions");
    const json = await api(`/api/pages/${page.id}/versions`, { method: "GET" });
    if (json) setVersions(json.versions);
  }

  async function restoreVersion(version: number) {
    if (!window.confirm(`Restore version ${version}? Current state is kept as a new version.`)) return;
    const json = await api(`/api/pages/${page.id}/versions`, {
      method: "POST",
      body: JSON.stringify({ version }),
    });
    if (json) {
      setMessage({ kind: "ok", text: `Restored v${version}. Reloading…` });
      window.location.reload();
    }
  }

  const canSave = permissions.edit || permissions.seo;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/pages"
            aria-label="Back to pages"
            className="rounded-lg p-2 text-stone-500 transition-colors hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-stone-800"
          >
            <ArrowLeft size={16} aria-hidden />
          </Link>
          <div>
            <h1 className="font-display text-xl font-extrabold tracking-tight">
              {title || "Untitled page"}
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">/{slug}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[page.status]}`}>
            {page.status.charAt(0) + page.status.slice(1).toLowerCase()}
          </span>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-950 dark:text-orange-300">
            {STAGE_LABELS[page.workflowStage]}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/${slug}?preview=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 transition-colors hover:border-orange-500 hover:text-orange-700 dark:border-stone-700 dark:text-stone-300"
          >
            <ExternalLink size={13} aria-hidden /> Preview
          </a>
          {permissions.publish && (
            <>
              {page.status !== "PUBLISHED" && (
                <button
                  onClick={() => void publishAction("publish")}
                  disabled={busy}
                  className="cursor-pointer rounded-full bg-green-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-500"
                >
                  Publish now
                </button>
              )}
              {page.status !== "PUBLISHED" && page.status !== "SCHEDULED" && (
                <button
                  onClick={schedule}
                  disabled={busy}
                  className="cursor-pointer rounded-full border border-amber-400 px-4 py-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-50 dark:text-amber-300"
                >
                  Schedule…
                </button>
              )}
              {(page.status === "PUBLISHED" || page.status === "SCHEDULED") && (
                <button
                  onClick={() => void publishAction("unpublish")}
                  disabled={busy}
                  className="cursor-pointer rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 transition-colors hover:border-orange-500 dark:border-stone-700 dark:text-stone-300"
                >
                  Unpublish
                </button>
              )}
              {page.status !== "ARCHIVED" ? (
                <button
                  onClick={() => void publishAction("archive")}
                  disabled={busy}
                  className="cursor-pointer rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 dark:text-red-400"
                >
                  Archive
                </button>
              ) : (
                <button
                  onClick={() => void publishAction("restore")}
                  disabled={busy}
                  className="cursor-pointer rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 dark:border-stone-700 dark:text-stone-300"
                >
                  Restore to draft
                </button>
              )}
            </>
          )}
          {canSave && (
            <button
              onClick={() => void save()}
              disabled={busy}
              className="flex cursor-pointer items-center gap-1.5 rounded-full bg-orange-600 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-500 disabled:opacity-60"
            >
              <Save size={13} aria-hidden /> {busy ? "Saving…" : "Save"}
            </button>
          )}
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

      <div className="mt-5 flex gap-1 border-b border-stone-200 dark:border-stone-800">
        {(["content", "workflow", "seo", "versions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => (t === "versions" ? void loadVersions() : setTab(t))}
            className={`cursor-pointer rounded-t-xl px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t
                ? "border-b-2 border-orange-600 text-orange-700 dark:text-orange-400"
                : "text-stone-500 hover:text-stone-800 dark:text-stone-400"
            }`}
          >
            {t === "content"
              ? "Content"
              : t === "workflow"
                ? "Workflow"
                : t === "seo"
                  ? "SEO"
                  : "Versions"}
          </button>
        ))}
      </div>

      {tab === "workflow" && <WorkflowPanel pageId={page.id} />}

      {tab === "content" && (
        <div className="mt-5 space-y-4">
          <div className={`${cardCls} grid grid-cols-1 gap-3 sm:grid-cols-2`}>
            <div>
              <label htmlFor="pe-title" className={labelCls}>Title</label>
              <input
                id="pe-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!permissions.edit}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="pe-slug" className={labelCls}>Slug</label>
              <input
                id="pe-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                disabled={!permissions.edit}
                className={inputCls}
              />
            </div>
          </div>

          {sections.map((section, i) => (
            <div key={i} className={cardCls}>
              <div className="mb-4 flex items-center justify-between">
                <p className="font-display text-sm font-bold">
                  <span className="mr-2 text-orange-600">{String(i + 1).padStart(2, "0")}</span>
                  {SECTION_DEFS[section.type].label}
                </p>
                {permissions.edit && (
                  <div className="flex gap-1">
                    <button onClick={() => moveSection(i, -1)} disabled={i === 0} aria-label="Move up" className="cursor-pointer rounded-lg p-1.5 text-stone-500 hover:bg-orange-50 disabled:opacity-30 dark:hover:bg-stone-800"><ArrowUp size={14} aria-hidden /></button>
                    <button onClick={() => moveSection(i, 1)} disabled={i === sections.length - 1} aria-label="Move down" className="cursor-pointer rounded-lg p-1.5 text-stone-500 hover:bg-orange-50 disabled:opacity-30 dark:hover:bg-stone-800"><ArrowDown size={14} aria-hidden /></button>
                    <button onClick={() => setSections((p) => p.filter((_, k) => k !== i))} aria-label="Remove section" className="cursor-pointer rounded-lg p-1.5 text-stone-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-stone-800"><Trash2 size={14} aria-hidden /></button>
                  </div>
                )}
              </div>
              <SectionFields
                section={section}
                disabled={!permissions.edit}
                onChange={(patch) => updateSection(i, patch)}
              />
            </div>
          ))}

          {permissions.edit && (
            <div className={`${cardCls} flex items-end gap-3`}>
              <div className="flex-1">
                <label htmlFor="pe-add" className={labelCls}>Add section</label>
                <select
                  id="pe-add"
                  value={addType}
                  onChange={(e) => setAddType(e.target.value as SectionType)}
                  className={inputCls}
                >
                  {(Object.keys(SECTION_DEFS) as SectionType[]).map((t) => (
                    <option key={t} value={t}>
                      {SECTION_DEFS[t].label} — {SECTION_DEFS[t].description}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setSections((p) => [...p, defaultSection(addType)])}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700 dark:bg-orange-600"
              >
                <Plus size={14} aria-hidden /> Add
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "seo" && (
        <div className={`mt-5 ${cardCls} max-w-2xl space-y-4`}>
          <div>
            <label htmlFor="seo-title" className={labelCls}>SEO title</label>
            <input id="seo-title" value={seo.seoTitle} disabled={!permissions.seo} onChange={(e) => setSeo({ ...seo, seoTitle: e.target.value })} className={inputCls} placeholder={title} />
            <p className="mt-1 text-xs text-stone-400">{seo.seoTitle.length}/60 recommended</p>
          </div>
          <div>
            <label htmlFor="seo-desc" className={labelCls}>Meta description</label>
            <textarea id="seo-desc" rows={3} value={seo.seoDescription} disabled={!permissions.seo} onChange={(e) => setSeo({ ...seo, seoDescription: e.target.value })} className={inputCls} />
            <p className="mt-1 text-xs text-stone-400">{seo.seoDescription.length}/160 recommended</p>
          </div>
          <div>
            <label htmlFor="seo-canonical" className={labelCls}>Canonical URL</label>
            <input id="seo-canonical" value={seo.canonicalUrl} disabled={!permissions.seo} onChange={(e) => setSeo({ ...seo, canonicalUrl: e.target.value })} className={inputCls} placeholder="https://…" />
          </div>
          <div>
            <label htmlFor="seo-og" className={labelCls}>Open Graph image URL</label>
            <input id="seo-og" value={seo.ogImage} disabled={!permissions.seo} onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })} className={inputCls} placeholder="https://…/og.jpg" />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={seo.noIndex}
              disabled={!permissions.seo}
              onChange={(e) => setSeo({ ...seo, noIndex: e.target.checked })}
              className="h-4 w-4 accent-orange-600"
            />
            Hide from search engines (noindex)
          </label>
          {!permissions.seo && (
            <p className="text-xs text-stone-400">
              SEO fields are managed by the SEO Manager role.
            </p>
          )}
          {permissions.seo && (
            <AiAssist
              kinds={["seo_title", "meta_description", "faq", "cta"]}
              getContext={() => `Page title: ${title}\nSlug: /${slug}`}
              insertLabel="Insert into field"
              onInsert={(kind, text) => {
                if (kind === "seo_title") setSeo({ ...seo, seoTitle: text.split("\n")[0].slice(0, 200) });
                else if (kind === "meta_description") setSeo({ ...seo, seoDescription: text.split("\n")[0].slice(0, 400) });
              }}
            />
          )}
        </div>
      )}

      {tab === "versions" && (
        <div className={`mt-5 ${cardCls}`}>
          {versions === null ? (
            <p className="text-sm text-stone-500">Loading…</p>
          ) : versions.length === 0 ? (
            <p className="text-sm text-stone-500">No versions yet.</p>
          ) : (
            <ul className="divide-y divide-stone-100 dark:divide-stone-800">
              {versions.map((v) => (
                <li key={v.version} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <History size={15} className="text-orange-600" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold">
                        v{v.version} · {v.note ?? "—"}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {v.createdByName ?? "System"} ·{" "}
                        {new Date(v.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                  </div>
                  {permissions.edit && (
                    <button
                      onClick={() => void restoreVersion(v.version)}
                      disabled={busy}
                      className="cursor-pointer rounded-full border border-stone-300 px-3.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:border-orange-500 hover:text-orange-700 dark:border-stone-700 dark:text-stone-300"
                    >
                      Restore
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ItemList<T extends object>({
  items,
  render,
  blank,
  set,
  disabled,
}: {
  items: T[];
  render: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode;
  blank: T;
  set: (items: T[]) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-stone-100 p-3 dark:border-stone-800">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              {render(item, (patch) =>
                set(items.map((it, k) => (k === i ? { ...it, ...patch } : it))),
              )}
            </div>
            {!disabled && (
              <button
                onClick={() => set(items.filter((_, k) => k !== i))}
                aria-label="Remove item"
                className="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:text-red-600"
              >
                <Trash2 size={13} aria-hidden />
              </button>
            )}
          </div>
        </div>
      ))}
      {!disabled && (
        <button
          onClick={() => set([...items, blank])}
          className="cursor-pointer rounded-full border border-dashed border-stone-300 px-4 py-1.5 text-xs font-semibold text-stone-500 hover:border-orange-400 hover:text-orange-700 dark:border-stone-700"
        >
          + Add item
        </button>
      )}
    </div>
  );
}

function SectionFields({
  section,
  disabled,
  onChange,
}: {
  section: Section;
  disabled: boolean;
  onChange: (patch: Partial<Section>) => void;
}) {
  const grid = "grid grid-cols-1 gap-3 sm:grid-cols-2";

  switch (section.type) {
    case "hero":
      return (
        <div className={grid}>
          <div><label className={labelCls}>Eyebrow</label><input value={section.eyebrow} disabled={disabled} onChange={(e) => onChange({ eyebrow: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Heading</label><input value={section.heading} disabled={disabled} onChange={(e) => onChange({ heading: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Highlighted word(s)</label><input value={section.highlight} disabled={disabled} onChange={(e) => onChange({ highlight: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>CTA label</label><input value={section.ctaLabel} disabled={disabled} onChange={(e) => onChange({ ctaLabel: e.target.value })} className={inputCls} /></div>
          <div className="sm:col-span-2"><label className={labelCls}>Copy</label><textarea rows={2} value={section.copy} disabled={disabled} onChange={(e) => onChange({ copy: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>CTA link</label><input value={section.ctaHref} disabled={disabled} onChange={(e) => onChange({ ctaHref: e.target.value })} className={inputCls} /></div>
        </div>
      );
    case "richText":
      return (
        <div className="space-y-3">
          <div><label className={labelCls}>Eyebrow (small label above the heading)</label><input value={section.eyebrow} disabled={disabled} onChange={(e) => onChange({ eyebrow: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Heading</label><input value={section.heading} disabled={disabled} onChange={(e) => onChange({ heading: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Body (blank line = new paragraph)</label><textarea rows={6} value={section.body} disabled={disabled} onChange={(e) => onChange({ body: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Side image (optional — shows left of the text)</label><input value={section.image} disabled={disabled} onChange={(e) => onChange({ image: e.target.value })} className={inputCls} placeholder="/section-images/… or /uploads/…" /></div>
          <div><label className={labelCls}>Image alt text</label><input value={section.imageAlt} disabled={disabled} onChange={(e) => onChange({ imageAlt: e.target.value })} className={inputCls} placeholder="Describe the photo for screen readers" /></div>
        </div>
      );
    case "cards":
      return (
        <div className="space-y-3">
          <div><label className={labelCls}>Heading</label><input value={section.heading} disabled={disabled} onChange={(e) => onChange({ heading: e.target.value })} className={inputCls} /></div>
          <ItemList
            items={section.items}
            blank={{ title: "", copy: "" }}
            disabled={disabled}
            set={(items) => onChange({ items })}
            render={(item, update) => (
              <div className="space-y-2">
                <input value={item.title} disabled={disabled} placeholder="Card title" onChange={(e) => update({ title: e.target.value })} className={inputCls} />
                <textarea rows={2} value={item.copy} disabled={disabled} placeholder="Card copy" onChange={(e) => update({ copy: e.target.value })} className={inputCls} />
              </div>
            )}
          />
        </div>
      );
    case "stats":
      return (
        <ItemList
          items={section.items}
          blank={{ value: "", label: "" }}
          disabled={disabled}
          set={(items) => onChange({ items })}
          render={(item, update) => (
            <div className={grid}>
              <input value={item.value} disabled={disabled} placeholder="250+" onChange={(e) => update({ value: e.target.value })} className={inputCls} />
              <input value={item.label} disabled={disabled} placeholder="projects shipped" onChange={(e) => update({ label: e.target.value })} className={inputCls} />
            </div>
          )}
        />
      );
    case "countries":
      return (
        <div className="space-y-3">
          <div className={grid}>
            <div><label className={labelCls}>Heading</label><input value={section.heading} disabled={disabled} onChange={(e) => onChange({ heading: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Big number (e.g. 12 or 12+)</label><input value={section.count} disabled={disabled} placeholder="12" onChange={(e) => onChange({ count: e.target.value })} className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>Copy (optional)</label><input value={section.copy} disabled={disabled} onChange={(e) => onChange({ copy: e.target.value })} className={inputCls} /></div>
          <ItemList
            items={section.countries}
            blank={{ name: "", code: "" }}
            disabled={disabled}
            set={(countries) => onChange({ countries })}
            render={(item, update) => (
              <div className={grid}>
                <input value={item.name} disabled={disabled} placeholder="United Arab Emirates" onChange={(e) => update({ name: e.target.value })} className={inputCls} />
                <input value={item.code} disabled={disabled} maxLength={2} placeholder="ae (2-letter code)" onChange={(e) => update({ code: e.target.value.toLowerCase() })} className={inputCls} />
              </div>
            )}
          />
        </div>
      );
    case "industries":
      return (
        <div className="space-y-3">
          <div className={grid}>
            <div><label className={labelCls}>Heading</label><input value={section.heading} disabled={disabled} onChange={(e) => onChange({ heading: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Highlighted word(s)</label><input value={section.highlight} disabled={disabled} onChange={(e) => onChange({ highlight: e.target.value })} className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>Intro copy</label><textarea rows={2} value={section.copy} disabled={disabled} onChange={(e) => onChange({ copy: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Callout strip</label><textarea rows={2} value={section.callout} disabled={disabled} onChange={(e) => onChange({ callout: e.target.value })} className={inputCls} /></div>
          <p className={labelCls}>Industries — icon keys: {INDUSTRY_ICON_KEYS.slice(0, 11).join(", ")}</p>
          <ItemList
            items={section.items}
            blank={{ name: "", blurb: "", icon: "" }}
            disabled={disabled}
            set={(items) => onChange({ items })}
            render={(item, update) => (
              <div className="space-y-2">
                <div className={grid}>
                  <input value={item.name} disabled={disabled} placeholder="Healthcare" onChange={(e) => update({ name: e.target.value })} className={inputCls} />
                  <input value={item.icon} disabled={disabled} placeholder="health" list="admin-industry-icons" onChange={(e) => update({ icon: e.target.value })} className={inputCls} />
                </div>
                <input value={item.blurb} disabled={disabled} placeholder="Attract more patients and build trust online." onChange={(e) => update({ blurb: e.target.value })} className={inputCls} />
              </div>
            )}
          />
          <datalist id="admin-industry-icons">
            {INDUSTRY_ICON_KEYS.map((k) => (<option key={k} value={k} />))}
          </datalist>
          <div className={grid}>
            <div><label className={labelCls}>Channel strip heading</label><input value={section.channelsHeading} disabled={disabled} onChange={(e) => onChange({ channelsHeading: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Closing goal line</label><input value={section.goal} disabled={disabled} onChange={(e) => onChange({ goal: e.target.value })} className={inputCls} /></div>
          </div>
          <p className={labelCls}>Channels</p>
          <ItemList
            items={section.channels}
            blank={{ name: "", icon: "" }}
            disabled={disabled}
            set={(channels) => onChange({ channels })}
            render={(item, update) => (
              <div className={grid}>
                <input value={item.name} disabled={disabled} placeholder="SEO" onChange={(e) => update({ name: e.target.value })} className={inputCls} />
                <input value={item.icon} disabled={disabled} placeholder="search" list="admin-industry-icons" onChange={(e) => update({ icon: e.target.value })} className={inputCls} />
              </div>
            )}
          />
        </div>
      );
    case "faq":
      return (
        <div className="space-y-3">
          <div><label className={labelCls}>Heading</label><input value={section.heading} disabled={disabled} onChange={(e) => onChange({ heading: e.target.value })} className={inputCls} /></div>
          <ItemList
            items={section.items}
            blank={{ q: "", a: "" }}
            disabled={disabled}
            set={(items) => onChange({ items })}
            render={(item, update) => (
              <div className="space-y-2">
                <input value={item.q} disabled={disabled} placeholder="Question" onChange={(e) => update({ q: e.target.value })} className={inputCls} />
                <textarea rows={2} value={item.a} disabled={disabled} placeholder="Answer" onChange={(e) => update({ a: e.target.value })} className={inputCls} />
              </div>
            )}
          />
        </div>
      );
    case "cta":
      return (
        <div className={grid}>
          <div><label className={labelCls}>Heading</label><input value={section.heading} disabled={disabled} onChange={(e) => onChange({ heading: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Copy</label><input value={section.copy} disabled={disabled} onChange={(e) => onChange({ copy: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>CTA label</label><input value={section.ctaLabel} disabled={disabled} onChange={(e) => onChange({ ctaLabel: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>CTA link</label><input value={section.ctaHref} disabled={disabled} onChange={(e) => onChange({ ctaHref: e.target.value })} className={inputCls} /></div>
        </div>
      );
    case "form":
      return (
        <div className={grid}>
          <div><label className={labelCls}>Heading</label><input value={section.heading} disabled={disabled} onChange={(e) => onChange({ heading: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Form slug (from the form builder)</label><input value={section.formSlug} disabled={disabled} placeholder="lead-form" onChange={(e) => onChange({ formSlug: e.target.value })} className={inputCls} /></div>
        </div>
      );
    case "video":
      return (
        <div className={grid}>
          <div><label className={labelCls}>Heading</label><input value={section.heading} disabled={disabled} onChange={(e) => onChange({ heading: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Video slug (from the video library)</label><input value={section.videoSlug} disabled={disabled} placeholder="agency-showreel" onChange={(e) => onChange({ videoSlug: e.target.value })} className={inputCls} /></div>
        </div>
      );
  }
}
