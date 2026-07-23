"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Plus, Trash2, X } from "lucide-react";

export type TestimonialRow = {
  id: string;
  quote: string;
  name: string;
  role: string;
  rating: number;
  visible: boolean;
};
export type ClientRow = {
  id: string;
  name: string;
  imageUrl: string | null;
  websiteUrl: string | null;
  visible: boolean;
};
export type CaseRow = {
  id: string;
  slug: string;
  client: string;
  title: string;
  industry: string;
  category: string;
  services: string[];
  challenge: string;
  solution: string;
  result: string;
  metrics: unknown;
  timeframe: string;
  image: string | null;
  visible: boolean;
};

const fieldCls =
  "rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
const inputCls = `w-full ${fieldCls}`;
const labelCls =
  "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400";
const btnCls =
  "flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-orange-700 disabled:opacity-60";

type Kind = "testimonials" | "clients" | "cases";

function metricsToText(v: unknown): string {
  if (!Array.isArray(v)) return "";
  return v
    .filter((m): m is { value: string; label: string } =>
      Boolean(m && typeof m === "object" && "value" in m && "label" in m),
    )
    .map((m) => `${m.value} | ${m.label}`)
    .join("\n");
}
function textToMetrics(text: string) {
  return text
    .split("\n")
    .map((l) => l.split("|").map((p) => p.trim()))
    .filter(([value, label]) => value && label)
    .slice(0, 4)
    .map(([value, label]) => ({ value, label }));
}

export default function ProofManager({
  testimonials,
  clients,
  cases,
}: {
  testimonials: TestimonialRow[];
  clients: ClientRow[];
  cases: CaseRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Kind>("testimonials");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /* Which row is open in edit mode, or "new" for the add form. Keyed by
     kind so switching tabs closes any open editor. */
  const [editing, setEditing] = useState<string | null>(null);

  /* PATCH/POST/DELETE against a proof entity. Returns success so callers
     can close their form only on a clean write. */
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

  const save = (kind: Kind, id: string | null, body: unknown) =>
    api(id ? `/api/proof/${kind}/${id}` : `/api/proof/${kind}`, {
      method: id ? "PATCH" : "POST",
      body: JSON.stringify(body),
    });

  const del = (kind: Kind, id: string, what: string) => {
    if (!confirm(`Delete this ${what}? This cannot be undone.`)) return;
    void api(`/api/proof/${kind}/${id}`, { method: "DELETE" });
  };
  const toggle = (kind: Kind, id: string, visible: boolean) =>
    void api(`/api/proof/${kind}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ visible: !visible }),
    });

  const switchTab = (k: Kind) => {
    setTab(k);
    setEditing(null);
    setError(null);
  };

  /* Shared row controls: edit / visibility / delete. */
  const RowActions = ({
    kind,
    id,
    visible,
    what,
  }: {
    kind: Kind;
    id: string;
    visible: boolean;
    what: string;
  }) => (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        onClick={() => setEditing(editing === id ? null : id)}
        disabled={busy}
        aria-label={editing === id ? "Close editor" : "Edit"}
        title="Edit"
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-stone-300 text-stone-400 transition-colors hover:border-orange-400 hover:text-orange-600 dark:border-stone-700"
      >
        {editing === id ? <X size={13} /> : <Pencil size={13} />}
      </button>
      <button
        onClick={() => toggle(kind, id, visible)}
        disabled={busy}
        title={visible ? "Visible on the site — click to hide" : "Hidden — click to show"}
        className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border transition-colors ${
          visible
            ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950"
            : "border-stone-300 text-stone-400 dark:border-stone-700"
        }`}
      >
        {visible ? <Eye size={13} /> : <EyeOff size={13} />}
      </button>
      <button
        onClick={() => del(kind, id, what)}
        disabled={busy}
        aria-label={`Delete ${what}`}
        title="Delete"
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-stone-300 text-stone-400 transition-colors hover:border-red-400 hover:text-red-600 dark:border-stone-700"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );

  const TABS: { key: Kind; label: string; count: number; live: number }[] = [
    {
      key: "testimonials",
      label: "Testimonials",
      count: testimonials.length,
      live: testimonials.filter((t) => t.visible).length,
    },
    {
      key: "clients",
      label: "Client logos",
      count: clients.length,
      live: clients.filter((c) => c.visible).length,
    },
    {
      key: "cases",
      label: "Case studies",
      count: cases.length,
      live: cases.filter((c) => c.visible).length,
    },
  ];

  return (
    <div>
      {/* Tabs — same segmented control as the Menus manager. */}
      <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-stone-100 p-1 dark:bg-stone-800 sm:w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.key
                ? "bg-white text-stone-900 shadow-sm dark:bg-stone-950 dark:text-stone-100"
                : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-stone-400">
              {t.live}/{t.count}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-3 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {tab === "testimonials" && (
        <div>
          <p className="mb-3 text-xs text-stone-500 dark:text-stone-400">
            Shown in the &ldquo;What clients say&rdquo; panel on the home page. The
            panel stays hidden while no testimonial is visible.
          </p>

          <div className="space-y-2">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-stone-200 dark:border-stone-800"
              >
                <div className="flex items-start gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-stone-700 dark:text-stone-200">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                      {t.name}
                      {t.role ? ` · ${t.role}` : ""} · {"★".repeat(t.rating)}
                    </p>
                  </div>
                  <RowActions kind="testimonials" id={t.id} visible={t.visible} what="testimonial" />
                </div>
                {editing === t.id && (
                  <TestimonialForm
                    row={t}
                    busy={busy}
                    onSave={async (b) => {
                      if (await save("testimonials", t.id, b)) setEditing(null);
                    }}
                    onCancel={() => setEditing(null)}
                  />
                )}
              </div>
            ))}
            {testimonials.length === 0 && (
              <p className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-400 dark:border-stone-700">
                No testimonials yet.
              </p>
            )}
          </div>

          {editing === "new" ? (
            <div className="mt-3 rounded-xl border border-stone-200 dark:border-stone-800">
              <TestimonialForm
                busy={busy}
                onSave={async (b) => {
                  if (await save("testimonials", null, b)) setEditing(null);
                }}
                onCancel={() => setEditing(null)}
              />
            </div>
          ) : (
            <button onClick={() => setEditing("new")} className={`${btnCls} mt-3`}>
              <Plus size={13} /> Add testimonial
            </button>
          )}
        </div>
      )}

      {tab === "clients" && (
        <div>
          <p className="mb-3 text-xs text-stone-500 dark:text-stone-400">
            The &ldquo;Our clients&rdquo; bar above the footer. Without a logo image
            the name renders as a wordmark.
          </p>

          <div className="space-y-2">
            {clients.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-stone-200 dark:border-stone-800"
              >
                <div className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                      {c.name}
                    </p>
                    <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                      {c.imageUrl || "no logo — wordmark"}
                      {c.websiteUrl ? ` · ${c.websiteUrl}` : ""}
                    </p>
                  </div>
                  <RowActions kind="clients" id={c.id} visible={c.visible} what="client" />
                </div>
                {editing === c.id && (
                  <ClientForm
                    row={c}
                    busy={busy}
                    onSave={async (b) => {
                      if (await save("clients", c.id, b)) setEditing(null);
                    }}
                    onCancel={() => setEditing(null)}
                  />
                )}
              </div>
            ))}
            {clients.length === 0 && (
              <p className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-400 dark:border-stone-700">
                No clients yet.
              </p>
            )}
          </div>

          {editing === "new" ? (
            <div className="mt-3 rounded-xl border border-stone-200 dark:border-stone-800">
              <ClientForm
                busy={busy}
                onSave={async (b) => {
                  if (await save("clients", null, b)) setEditing(null);
                }}
                onCancel={() => setEditing(null)}
              />
            </div>
          ) : (
            <button onClick={() => setEditing("new")} className={`${btnCls} mt-3`}>
              <Plus size={13} /> Add client
            </button>
          )}
        </div>
      )}

      {tab === "cases" && (
        <div>
          <p className="mb-3 text-xs text-stone-500 dark:text-stone-400">
            Powers the /work page and its filter tabs. Metrics are one per line as
            <code className="mx-1 rounded bg-stone-100 px-1 dark:bg-stone-800">
              value | label
            </code>
            — publish only results you can evidence.
          </p>

          <div className="space-y-2">
            {cases.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-stone-200 dark:border-stone-800"
              >
                <div className="flex items-start gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                      {c.client} — {c.title}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {c.category}
                      {c.industry ? ` · ${c.industry}` : ""} · /{c.slug} ·{" "}
                      {metricsToText(c.metrics).split("\n").filter(Boolean).length} metrics
                    </p>
                  </div>
                  <RowActions kind="cases" id={c.id} visible={c.visible} what="case study" />
                </div>
                {editing === c.id && (
                  <CaseForm
                    row={c}
                    busy={busy}
                    onSave={async (b) => {
                      if (await save("cases", c.id, b)) setEditing(null);
                    }}
                    onCancel={() => setEditing(null)}
                  />
                )}
              </div>
            ))}
            {cases.length === 0 && (
              <p className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-400 dark:border-stone-700">
                No case studies yet — /work shows its empty state.
              </p>
            )}
          </div>

          {editing === "new" ? (
            <div className="mt-3 rounded-xl border border-stone-200 dark:border-stone-800">
              <CaseForm
                busy={busy}
                onSave={async (b) => {
                  if (await save("cases", null, b)) setEditing(null);
                }}
                onCancel={() => setEditing(null)}
              />
            </div>
          ) : (
            <button onClick={() => setEditing("new")} className={`${btnCls} mt-3`}>
              <Plus size={13} /> Add case study
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- forms: pre-filled for edit, blank for add ---- */

function FormShell({
  children,
  onSubmit,
  onCancel,
  busy,
  isNew,
}: {
  children: React.ReactNode;
  onSubmit: () => void;
  onCancel: () => void;
  busy: boolean;
  isNew: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-3 border-t border-stone-100 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-950/40"
    >
      {children}
      <div className="flex items-center gap-2">
        <button type="submit" disabled={busy} className={btnCls}>
          {busy ? "Saving…" : isNew ? "Add" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function TestimonialForm({
  row,
  busy,
  onSave,
  onCancel,
}: {
  row?: TestimonialRow;
  busy: boolean;
  onSave: (body: unknown) => void;
  onCancel: () => void;
}) {
  const [quote, setQuote] = useState(row?.quote ?? "");
  const [name, setName] = useState(row?.name ?? "");
  const [rrole, setRole] = useState(row?.role ?? "");
  const [rating, setRating] = useState(String(row?.rating ?? 5));

  return (
    <FormShell
      busy={busy}
      isNew={!row}
      onCancel={onCancel}
      onSubmit={() =>
        onSave({
          quote,
          name,
          role: rrole || undefined,
          rating: Number(rating),
        })
      }
    >
      <div>
        <label className={labelCls}>Quote *</label>
        <textarea value={quote} onChange={(e) => setQuote(e.target.value)} rows={2} required className={inputCls} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} placeholder="Priya Sharma" />
        </div>
        <div>
          <label className={labelCls}>Role / company</label>
          <input value={rrole} onChange={(e) => setRole(e.target.value)} className={inputCls} placeholder="Founder, Acme" />
        </div>
        <div>
          <label className={labelCls}>Rating</label>
          <select value={rating} onChange={(e) => setRating(e.target.value)} className={inputCls}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
    </FormShell>
  );
}

function ClientForm({
  row,
  busy,
  onSave,
  onCancel,
}: {
  row?: ClientRow;
  busy: boolean;
  onSave: (body: unknown) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(row?.name ?? "");
  const [imageUrl, setImageUrl] = useState(row?.imageUrl ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(row?.websiteUrl ?? "");

  return (
    <FormShell
      busy={busy}
      isNew={!row}
      onCancel={onCancel}
      onSubmit={() =>
        onSave({ name, imageUrl: imageUrl || null, websiteUrl: websiteUrl || null })
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Client name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Logo URL</label>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={inputCls} placeholder="/trust-logos/…" />
        </div>
        <div>
          <label className={labelCls}>Website</label>
          <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className={inputCls} placeholder="https://…" />
        </div>
      </div>
    </FormShell>
  );
}

function CaseForm({
  row,
  busy,
  onSave,
  onCancel,
}: {
  row?: CaseRow;
  busy: boolean;
  onSave: (body: unknown) => void;
  onCancel: () => void;
}) {
  const [client, setClient] = useState(row?.client ?? "");
  const [slug, setSlug] = useState(row?.slug ?? "");
  const [category, setCategory] = useState(row?.category ?? "Web");
  const [title, setTitle] = useState(row?.title ?? "");
  const [industry, setIndustry] = useState(row?.industry ?? "");
  const [timeframe, setTimeframe] = useState(row?.timeframe ?? "");
  const [image, setImage] = useState(row?.image ?? "");
  const [services, setServices] = useState((row?.services ?? []).join(", "));
  const [challenge, setChallenge] = useState(row?.challenge ?? "");
  const [solution, setSolution] = useState(row?.solution ?? "");
  const [result, setResult] = useState(row?.result ?? "");
  const [metrics, setMetrics] = useState(metricsToText(row?.metrics));

  return (
    <FormShell
      busy={busy}
      isNew={!row}
      onCancel={onCancel}
      onSubmit={() =>
        onSave({
          client,
          slug,
          category,
          title,
          industry: industry || undefined,
          timeframe: timeframe || undefined,
          image: image || null,
          services: services.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 10),
          challenge: challenge || undefined,
          solution: solution || undefined,
          result: result || undefined,
          metrics: textToMetrics(metrics),
        })
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Client *</label>
          <input value={client} onChange={(e) => setClient(e.target.value)} required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Slug *</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} required className={inputCls} placeholder="acme-growth" />
        </div>
        <div>
          <label className={labelCls}>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
            <option>Web</option>
            <option>Marketing</option>
            <option>AI</option>
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>Headline result *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputCls} placeholder="4.2× revenue growth in 9 months" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Industry</label>
          <input value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputCls} placeholder="D2C e-commerce" />
        </div>
        <div>
          <label className={labelCls}>Timeframe</label>
          <input value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className={inputCls} placeholder="9 months" />
        </div>
        <div>
          <label className={labelCls}>Image URL</label>
          <input value={image} onChange={(e) => setImage(e.target.value)} className={inputCls} placeholder="/uploads/…" />
        </div>
      </div>
      <div>
        <label className={labelCls}>Services (comma separated)</label>
        <input value={services} onChange={(e) => setServices(e.target.value)} className={inputCls} placeholder="Technical SEO, Performance Max, CRO" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Challenge</label>
          <textarea value={challenge} onChange={(e) => setChallenge(e.target.value)} rows={3} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>What we did</label>
          <textarea value={solution} onChange={(e) => setSolution(e.target.value)} rows={3} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Result</label>
          <textarea value={result} onChange={(e) => setResult(e.target.value)} rows={3} className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Metrics — one per line, value | label</label>
        <textarea value={metrics} onChange={(e) => setMetrics(e.target.value)} rows={3} className={inputCls} placeholder={"4.2× | revenue growth\n+312% | organic traffic"} />
      </div>
    </FormShell>
  );
}
