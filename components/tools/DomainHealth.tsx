"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Search, XCircle } from "lucide-react";

/* Domain health check.

   We deliberately do NOT show a "domain authority" score: DA/DR are
   proprietary metrics from Moz and Ahrefs behind paid APIs, and a made-up
   number would be worse than none. Instead this reports signals we can
   verify ourselves — reachability, HTTPS, indexability, structured data
   and page weight — and says plainly where the real metric comes from. */

type Result = {
  url: string;
  status: number;
  https: boolean;
  ms: number;
  sizeKb: number;
  indexable: boolean;
  canonical: string | null;
  jsonLd: number;
  title: string | null;
  words: number;
  lang: string | null;
};

export default function DomainHealth() {
  const [domain, setDomain] = useState("");
  const [r, setR] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !domain.trim()) return;
    setBusy(true);
    setError("");
    setR(null);
    try {
      const res = await fetch(withBase("/api/tools/page-audit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: domain }),
      });
      const json = await res.json().catch(() => ({}));
      if (!json.ok) setError(json.error ?? "Could not reach that domain.");
      else setR(json.result);
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  const rows = r
    ? [
        { label: "Homepage reachable", ok: r.status >= 200 && r.status < 400, detail: `HTTP ${r.status} in ${r.ms}ms` },
        { label: "Secure (HTTPS)", ok: r.https, detail: r.https ? "Served over HTTPS" : "Not served over HTTPS" },
        { label: "Open to search engines", ok: r.indexable, detail: r.indexable ? "No noindex directive" : "Blocked by a noindex tag" },
        { label: "Canonical set", ok: Boolean(r.canonical), detail: r.canonical ? r.canonical.slice(0, 70) : "No canonical tag" },
        { label: "Structured data", ok: r.jsonLd > 0, detail: r.jsonLd > 0 ? `${r.jsonLd} JSON-LD block(s)` : "None found" },
        { label: "Content on the homepage", ok: r.words >= 300, detail: `~${r.words.toLocaleString("en-IN")} words · ${r.sizeKb}KB` },
        { label: "Fast first response", ok: r.ms < 800, detail: `${r.ms}ms to first byte of HTML` },
      ]
    : [];

  const score = rows.length ? Math.round((rows.filter((x) => x.ok).length / rows.length) * 100) : 0;

  return (
    <div className="rounded-[2rem] bg-[#FFF6EF] p-6 sm:p-8">
      <form onSubmit={run} className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="domain-host">
          Domain
        </label>
        <input
          id="domain-host"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="yourdomain.com"
          className="h-12 w-full min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none transition-colors focus:border-orange-500"
        />
        <button
          type="submit"
          disabled={busy || !domain.trim()}
          className="inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#F26419] px-6 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
        >
          <Search size={15} aria-hidden /> {busy ? "Checking…" : "Check domain"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {r && (
        <div className="mt-6 grid gap-5 lg:grid-cols-[200px_minmax(0,1fr)]">
          <div className="rounded-2xl bg-stone-900 p-5 text-center">
            <p className="text-xs uppercase tracking-wide text-stone-400">Health signals</p>
            <p className="font-display text-4xl font-extrabold text-[#FDBA74]">{score}%</p>
            <p className="mt-1 text-xs text-stone-400">
              {rows.filter((x) => x.ok).length} of {rows.length} passing
            </p>
          </div>
          <ul className="overflow-hidden rounded-2xl bg-white">
            {rows.map((x) => (
              <li key={x.label} className="flex gap-3 border-b border-stone-100 px-4 py-3 last:border-0">
                {x.ok ? (
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
                ) : (
                  <XCircle size={16} className="mt-0.5 shrink-0 text-red-600" aria-hidden />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900">{x.label}</p>
                  <p className="truncate text-xs text-stone-600">{x.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex items-start gap-2 rounded-xl bg-white px-4 py-3">
        <Info size={15} className="mt-0.5 shrink-0 text-[#F26419]" aria-hidden />
        <p className="text-xs leading-relaxed text-stone-600">
          <b className="font-semibold text-stone-800">Why there&rsquo;s no DA score here:</b>{" "}
          &ldquo;Domain Authority&rdquo; is Moz&rsquo;s metric and &ldquo;Domain Rating&rdquo; is
          Ahrefs&rsquo; — both come from paid APIs, and neither is a Google ranking factor. We show
          signals we can verify instead. For a real backlink profile, we run it during the free
          15-page audit.
        </p>
      </div>

      {!r && !error && (
        <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-stone-500">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-stone-400" aria-hidden />
          Checks the homepage as delivered to a browser — reachability, security, indexability and
          content depth.
        </p>
      )}
    </div>
  );
}
