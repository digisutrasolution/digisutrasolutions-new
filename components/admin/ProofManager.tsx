"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import AdminSection from "@/components/admin/AdminSection";

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

/* Metrics are entered one per line as "value | label" — a repeatable field
   group would be more clicks for the same three numbers. */
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
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function api(path: string, init: RequestInit) {
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

  const del = (kind: string, id: string, what: string) => {
    if (!confirm(`Delete this ${what}? This cannot be undone.`)) return;
    void api(`/api/proof/${kind}/${id}`, { method: "DELETE" });
  };
  const toggle = (kind: string, id: string, visible: boolean) =>
    void api(`/api/proof/${kind}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ visible: !visible }),
    });

  const VisibilityButton = ({
    kind,
    id,
    visible,
  }: {
    kind: string;
    id: string;
    visible: boolean;
  }) => (
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
  );

  const DeleteButton = ({
    kind,
    id,
    what,
  }: {
    kind: string;
    id: string;
    what: string;
  }) => (
    <button
      onClick={() => del(kind, id, what)}
      disabled={busy}
      aria-label={`Delete ${what}`}
      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-stone-300 text-stone-400 transition-colors hover:border-red-400 hover:text-red-600 dark:border-stone-700"
    >
      <Trash2 size={13} />
    </button>
  );

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Testimonials */}
      <AdminSection
        title="Testimonials"
        chip={`${testimonials.filter((t) => t.visible).length} live · ${testimonials.length} total`}
        defaultOpen
      >
        <p className="mb-4 text-xs text-stone-500 dark:text-stone-400">
          Shown in the &ldquo;What clients say&rdquo; panel on the home page. Only add
          quotes a client actually gave you — the panel stays hidden while this
          list is empty.
        </p>

        <div className="space-y-2">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="flex items-start gap-3 rounded-xl border border-stone-200 p-3 dark:border-stone-800"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-stone-700 dark:text-stone-200">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  {t.name}
                  {t.role ? ` · ${t.role}` : ""} · {"★".repeat(t.rating)}
                </p>
              </div>
              <VisibilityButton kind="testimonials" id={t.id} visible={t.visible} />
              <DeleteButton kind="testimonials" id={t.id} what="testimonial" />
            </div>
          ))}
          {testimonials.length === 0 && (
            <p className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-400 dark:border-stone-700">
              No testimonials yet.
            </p>
          )}
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const form = e.currentTarget;
            const ok = await api("/api/proof/testimonials", {
              method: "POST",
              body: JSON.stringify({
                quote: fd.get("quote"),
                name: fd.get("name"),
                role: fd.get("role") || undefined,
                rating: fd.get("rating"),
              }),
            });
            if (ok) form.reset();
          }}
          className="mt-4 space-y-3 rounded-xl border border-stone-200 p-4 dark:border-stone-800"
        >
          <div>
            <label className={labelCls}>Quote *</label>
            <textarea name="quote" required rows={2} className={inputCls} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Name *</label>
              <input name="name" required className={inputCls} placeholder="Priya Sharma" />
            </div>
            <div>
              <label className={labelCls}>Role / company</label>
              <input name="role" className={inputCls} placeholder="Founder, Acme" />
            </div>
            <div>
              <label className={labelCls}>Rating</label>
              <select name="rating" defaultValue="5" className={inputCls}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} star{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" disabled={busy} className={btnCls}>
            <Plus size={13} /> Add testimonial
          </button>
        </form>
      </AdminSection>

      {/* Client logos */}
      <AdminSection
        title="Client logos"
        chip={`${clients.filter((c) => c.visible).length} live · ${clients.length} total`}
      >
        <p className="mb-4 text-xs text-stone-500 dark:text-stone-400">
          The &ldquo;Our clients&rdquo; bar above the footer. Without a logo image the
          name renders as a wordmark. The bar hides entirely while this is empty.
        </p>

        <div className="space-y-2">
          {clients.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-stone-200 p-3 dark:border-stone-800"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                  {c.name}
                </p>
                <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                  {c.imageUrl || "no logo — wordmark"}
                  {c.websiteUrl ? ` · ${c.websiteUrl}` : ""}
                </p>
              </div>
              <VisibilityButton kind="clients" id={c.id} visible={c.visible} />
              <DeleteButton kind="clients" id={c.id} what="client" />
            </div>
          ))}
          {clients.length === 0 && (
            <p className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-400 dark:border-stone-700">
              No clients yet.
            </p>
          )}
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const form = e.currentTarget;
            const ok = await api("/api/proof/clients", {
              method: "POST",
              body: JSON.stringify({
                name: fd.get("name"),
                imageUrl: (fd.get("imageUrl") as string) || null,
                websiteUrl: (fd.get("websiteUrl") as string) || null,
              }),
            });
            if (ok) form.reset();
          }}
          className="mt-4 grid gap-3 rounded-xl border border-stone-200 p-4 dark:border-stone-800 sm:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <div>
            <label className={labelCls}>Client name *</label>
            <input name="name" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Logo URL</label>
            <input name="imageUrl" className={inputCls} placeholder="/uploads/…" />
          </div>
          <div>
            <label className={labelCls}>Website</label>
            <input name="websiteUrl" className={inputCls} placeholder="https://…" />
          </div>
          <button type="submit" disabled={busy} className={`${btnCls} self-end`}>
            <Plus size={13} /> Add
          </button>
        </form>
      </AdminSection>

      {/* Case studies */}
      <AdminSection
        title="Case studies"
        chip={`${cases.filter((c) => c.visible).length} live · ${cases.length} total`}
      >
        <p className="mb-4 text-xs text-stone-500 dark:text-stone-400">
          Powers the /work page and its filter tabs. Metrics are one per line as
          <code className="mx-1 rounded bg-stone-100 px-1 dark:bg-stone-800">
            value | label
          </code>
          — for example
          <code className="mx-1 rounded bg-stone-100 px-1 dark:bg-stone-800">
            4.2× | revenue growth
          </code>
          . Publish only results you can evidence.
        </p>

        <div className="space-y-2">
          {cases.map((c) => (
            <div
              key={c.id}
              className="flex items-start gap-3 rounded-xl border border-stone-200 p-3 dark:border-stone-800"
            >
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
              <VisibilityButton kind="cases" id={c.id} visible={c.visible} />
              <DeleteButton kind="cases" id={c.id} what="case study" />
            </div>
          ))}
          {cases.length === 0 && (
            <p className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-400 dark:border-stone-700">
              No case studies yet — /work shows its empty state.
            </p>
          )}
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const form = e.currentTarget;
            const services = String(fd.get("services") ?? "")
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
              .slice(0, 10);
            const ok = await api("/api/proof/cases", {
              method: "POST",
              body: JSON.stringify({
                slug: fd.get("slug"),
                client: fd.get("client"),
                title: fd.get("title"),
                industry: fd.get("industry") || undefined,
                category: fd.get("category"),
                services,
                challenge: fd.get("challenge") || undefined,
                solution: fd.get("solution") || undefined,
                result: fd.get("result") || undefined,
                metrics: textToMetrics(String(fd.get("metrics") ?? "")),
                timeframe: fd.get("timeframe") || undefined,
                image: (fd.get("image") as string) || null,
              }),
            });
            if (ok) form.reset();
          }}
          className="mt-4 space-y-3 rounded-xl border border-stone-200 p-4 dark:border-stone-800"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Client *</label>
              <input name="client" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Slug *</label>
              <input name="slug" required className={inputCls} placeholder="acme-growth" />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select name="category" defaultValue="Web" className={inputCls}>
                <option>Web</option>
                <option>Marketing</option>
                <option>AI</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Headline result *</label>
            <input
              name="title"
              required
              className={inputCls}
              placeholder="4.2× revenue growth in 9 months"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Industry</label>
              <input name="industry" className={inputCls} placeholder="D2C e-commerce" />
            </div>
            <div>
              <label className={labelCls}>Timeframe</label>
              <input name="timeframe" className={inputCls} placeholder="9 months" />
            </div>
            <div>
              <label className={labelCls}>Image URL</label>
              <input name="image" className={inputCls} placeholder="/uploads/…" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Services (comma separated)</label>
            <input
              name="services"
              className={inputCls}
              placeholder="Technical SEO, Performance Max, CRO"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Challenge</label>
              <textarea name="challenge" rows={3} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>What we did</label>
              <textarea name="solution" rows={3} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Result</label>
              <textarea name="result" rows={3} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Metrics — one per line, value | label</label>
            <textarea
              name="metrics"
              rows={3}
              className={inputCls}
              placeholder={"4.2× | revenue growth\n+312% | organic traffic"}
            />
          </div>
          <button type="submit" disabled={busy} className={btnCls}>
            <Plus size={13} /> Add case study
          </button>
        </form>
      </AdminSection>
    </div>
  );
}
