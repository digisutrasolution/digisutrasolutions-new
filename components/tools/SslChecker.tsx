"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Search, ShieldCheck, XCircle } from "lucide-react";

type CertInfo = {
  host: string;
  valid: boolean;
  reason?: string;
  issuer?: string;
  subject?: string;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
  altNames?: string[];
  protocol?: string;
};

const fmt = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

/* SSL checker — the certificate read happens server-side (browsers can't
   inspect another site's certificate), everything else is local. */
export default function SslChecker() {
  const [host, setHost] = useState("");
  const [result, setResult] = useState<CertInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !host.trim()) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(withBase("/api/tools/ssl"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not check that domain.");
      } else {
        setResult(json.result);
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  const days = result?.daysRemaining ?? 0;
  const tone = !result
    ? null
    : !result.valid
      ? { bg: "bg-red-50", text: "text-red-700", Icon: XCircle, label: "Problem found" }
      : days <= 21
        ? { bg: "bg-amber-50", text: "text-amber-800", Icon: AlertTriangle, label: "Expiring soon" }
        : { bg: "bg-emerald-50", text: "text-emerald-700", Icon: CheckCircle2, label: "Valid" };

  return (
    <div className="rounded-[2rem] bg-[#FFF6EF] p-6 sm:p-8">
      <form onSubmit={check} className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="ssl-host">
          Domain
        </label>
        <input
          id="ssl-host"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="yourdomain.com"
          className="h-12 w-full min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none transition-colors focus:border-orange-500"
        />
        <button
          type="submit"
          disabled={busy || !host.trim()}
          className="inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#F26419] px-6 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
        >
          <Search size={15} aria-hidden /> {busy ? "Checking…" : "Check SSL"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {result && tone && (
        <div className="mt-6 overflow-hidden rounded-2xl bg-white">
          <div className={`flex items-center gap-2.5 px-5 py-3.5 ${tone.bg}`}>
            <tone.Icon size={18} className={tone.text} aria-hidden />
            <span className={`font-display text-sm font-bold ${tone.text}`}>
              {tone.label} — {result.host}
            </span>
          </div>
          <div className="px-5 py-4">
            {result.reason && (
              <p className="mb-3 text-sm leading-relaxed text-stone-600">{result.reason}</p>
            )}
            {result.validTo && (
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <Item label="Expires" value={`${fmt(result.validTo)} (${days} days)`} />
                <Item label="Issued by" value={result.issuer ?? "—"} />
                <Item label="Issued on" value={fmt(result.validFrom)} />
                <Item label="Protocol" value={result.protocol ?? "—"} />
                {result.altNames && result.altNames.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                      Also covers
                    </dt>
                    <dd className="mt-1 flex flex-wrap gap-1.5">
                      {result.altNames.map((n) => (
                        <span
                          key={n}
                          className="rounded-full bg-stone-100 px-2.5 py-1 font-mono text-[11px] text-stone-600"
                        >
                          {n}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            )}
            {result.valid && days <= 21 && (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                Renew this now — an expired certificate makes browsers block the site outright.
              </p>
            )}
          </div>
        </div>
      )}

      {!result && !error && (
        <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-stone-500">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#F26419]" aria-hidden />
          Checks the certificate on port 443 — expiry date, issuer and which domains it covers.
          Nothing about your site is stored.
        </p>
      )}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-stone-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-stone-900">{value}</dd>
    </div>
  );
}
