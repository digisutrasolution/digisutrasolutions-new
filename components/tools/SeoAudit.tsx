"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Search, XCircle } from "lucide-react";

type Result = {
  url: string;
  status: number;
  https: boolean;
  ms: number;
  sizeKb: number;
  title: string | null;
  titleLength: number;
  description: string | null;
  descriptionLength: number;
  canonical: string | null;
  indexable: boolean;
  ogTitle: boolean;
  ogImage: boolean;
  viewport: boolean;
  lang: string | null;
  h1Count: number;
  h1: string | null;
  h2Count: number;
  images: number;
  imgsMissingAlt: number;
  jsonLd: number;
  words: number;
};

type Verdict = "pass" | "warn" | "fail";
type Row = { label: string; verdict: Verdict; detail: string };

function grade(r: Result): Row[] {
  return [
    {
      label: "Page loads over HTTPS",
      verdict: r.https ? "pass" : "fail",
      detail: r.https ? `Responded ${r.status} in ${r.ms}ms` : "Served over plain HTTP — browsers flag this.",
    },
    {
      label: "Indexable by search engines",
      verdict: r.indexable ? "pass" : "fail",
      detail: r.indexable ? "No noindex directive found." : "A noindex robots tag is present — this page cannot rank.",
    },
    {
      label: "Title tag",
      verdict: !r.title ? "fail" : r.titleLength > 60 || r.titleLength < 20 ? "warn" : "pass",
      detail: r.title ? `${r.titleLength} characters — "${r.title.slice(0, 70)}"` : "No title tag found.",
    },
    {
      label: "Meta description",
      verdict: !r.description ? "warn" : r.descriptionLength > 165 || r.descriptionLength < 70 ? "warn" : "pass",
      detail: r.description ? `${r.descriptionLength} characters` : "Missing — Google will invent one from the page.",
    },
    {
      label: "Single H1",
      verdict: r.h1Count === 1 ? "pass" : r.h1Count === 0 ? "fail" : "warn",
      detail: r.h1Count === 1 ? `"${(r.h1 ?? "").slice(0, 70)}"` : `${r.h1Count} H1 tags found — use exactly one.`,
    },
    {
      label: "Section headings",
      verdict: r.h2Count >= 2 ? "pass" : "warn",
      detail: `${r.h2Count} H2 headings — these are what AI answers and snippets lift.`,
    },
    {
      label: "Canonical URL",
      verdict: r.canonical ? "pass" : "warn",
      detail: r.canonical ? r.canonical.slice(0, 80) : "No canonical tag — duplicate URLs may compete.",
    },
    {
      label: "Image alt text",
      verdict: r.images === 0 ? "warn" : r.imgsMissingAlt === 0 ? "pass" : r.imgsMissingAlt > 3 ? "fail" : "warn",
      detail:
        r.images === 0
          ? "No images found in the HTML."
          : `${r.imgsMissingAlt} of ${r.images} images have no alt text.`,
    },
    {
      label: "Social preview tags",
      verdict: r.ogTitle && r.ogImage ? "pass" : "warn",
      detail:
        r.ogTitle && r.ogImage
          ? "og:title and og:image both set."
          : `Missing ${[!r.ogTitle && "og:title", !r.ogImage && "og:image"].filter(Boolean).join(" and ")} — links share badly.`,
    },
    {
      label: "Structured data",
      verdict: r.jsonLd > 0 ? "pass" : "warn",
      detail: r.jsonLd > 0 ? `${r.jsonLd} JSON-LD block(s) found.` : "No JSON-LD — you're leaving rich results on the table.",
    },
    {
      label: "Mobile viewport",
      verdict: r.viewport ? "pass" : "fail",
      detail: r.viewport ? "Viewport meta present." : "No viewport meta — the page won't scale on phones.",
    },
    {
      label: "Content depth",
      verdict: r.words >= 300 ? "pass" : "warn",
      detail: `About ${r.words.toLocaleString("en-IN")} words of visible text · ${r.sizeKb}KB HTML.`,
    },
  ];
}

const ICON = {
  pass: { Icon: CheckCircle2, cls: "text-emerald-600" },
  warn: { Icon: AlertTriangle, cls: "text-amber-600" },
  fail: { Icon: XCircle, cls: "text-red-600" },
};

export default function SeoAudit() {
  const [url, setUrl] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !url.trim()) return;
    setBusy(true);
    setError("");
    setRows(null);
    try {
      const res = await fetch(withBase("/api/tools/page-audit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json().catch(() => ({}));
      if (!json.ok) setError(json.error ?? "Could not audit that page.");
      else {
        setResult(json.result);
        setRows(grade(json.result));
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  const passed = rows?.filter((r) => r.verdict === "pass").length ?? 0;

  return (
    <div className="rounded-[2rem] bg-[#FFF6EF] p-6 sm:p-8">
      <form onSubmit={run} className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="seo-url">
          Page URL
        </label>
        <input
          id="seo-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="yourdomain.com/services"
          className="h-12 w-full min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none transition-colors focus:border-orange-500"
        />
        <button
          type="submit"
          disabled={busy || !url.trim()}
          className="inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#F26419] px-6 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
        >
          <Search size={15} aria-hidden /> {busy ? "Auditing…" : "Audit page"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {rows && result && (
        <div className="mt-6 overflow-hidden rounded-2xl bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
            <div>
              <p className="font-display text-lg font-extrabold text-stone-900">
                {passed}/{rows.length} checks passed
              </p>
              <p className="truncate text-xs text-stone-500">{result.url}</p>
            </div>
            <p className="text-xs text-stone-500">
              {result.status} · {result.ms}ms
            </p>
          </div>
          <ul>
            {rows.map((r) => {
              const { Icon, cls } = ICON[r.verdict];
              return (
                <li key={r.label} className="flex gap-3 border-b border-stone-100 px-5 py-3 last:border-0">
                  <Icon size={17} className={`mt-0.5 shrink-0 ${cls}`} aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900">{r.label}</p>
                    <p className="text-xs leading-relaxed text-stone-600">{r.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="mt-5 text-xs leading-relaxed text-stone-500">
        Checks one page&rsquo;s HTML as delivered — it doesn&rsquo;t run JavaScript or crawl your
        whole site. The free 15-page audit covers the rest: speed, backlinks, competitors and
        conversion.
      </p>
    </div>
  );
}
