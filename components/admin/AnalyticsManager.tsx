"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import type { AnalyticsSettings } from "@/lib/analytics";

const fieldCls =
  "rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

const TAGS = [
  {
    key: "ga4Id" as const,
    label: "Google Analytics 4",
    placeholder: "G-XXXXXXXXXX",
    hint: "Admin → Data streams → Measurement ID",
  },
  {
    key: "gtmId" as const,
    label: "Google Tag Manager",
    placeholder: "GTM-XXXXXXX",
    hint: "Container ID. Use instead of GA4 if you manage tags in GTM.",
  },
  {
    key: "metaPixelId" as const,
    label: "Meta Pixel",
    placeholder: "123456789012345",
    hint: "Events Manager → Data sources → Pixel ID",
  },
  {
    key: "clarityId" as const,
    label: "Microsoft Clarity",
    placeholder: "abcdefghij",
    hint: "Heatmaps and session recordings. Project ID from the Clarity URL.",
  },
];

export default function AnalyticsManager({
  settings,
}: {
  settings: AnalyticsSettings;
}) {
  const router = useRouter();
  const [f, setF] = useState<AnalyticsSettings>(settings);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof AnalyticsSettings>(k: K, v: AnalyticsSettings[K]) =>
    setF((p) => ({ ...p, [k]: v }));

  async function save() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(withBase("/api/settings/analytics"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analytics: f }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setErr(json.error ?? "Save failed.");
        return;
      }
      setMsg("Saved — live on the next page load.");
      router.refresh();
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-stone-500 dark:text-stone-400">
        Paste the IDs you want to use and switch tracking on. Empty fields load
        nothing at all — with everything blank the site makes zero third-party
        requests and relies only on the built-in cookieless pageview counter.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {TAGS.map((t) => (
          <div key={t.key}>
            <label
              htmlFor={`an-${t.key}`}
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400"
            >
              {t.label}
            </label>
            <input
              id={`an-${t.key}`}
              value={f[t.key]}
              onChange={(e) => set(t.key, e.target.value)}
              placeholder={t.placeholder}
              className={`w-full ${fieldCls}`}
            />
            <p className="mt-1 text-[11px] text-stone-400">{t.hint}</p>
          </div>
        ))}
      </div>

      <label className="flex items-start gap-2.5 rounded-xl border border-stone-200 p-3 dark:border-stone-800">
        <input
          type="checkbox"
          checked={f.enabled}
          onChange={(e) => set("enabled", e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-orange-600"
        />
        <span className="text-sm text-stone-700 dark:text-stone-200">
          Load these tags on the public site
          <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-400">
            Off by default. Nothing loads until this is ticked, even with IDs
            filled in.
          </span>
        </span>
      </label>

      <p className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <TriangleAlert size={15} aria-hidden className="mt-0.5 shrink-0" />
        <span>
          Google tags start in Consent Mode with storage denied, so they stay
          cookieless until a visitor consents. Meta Pixel and Clarity have no
          such mode — they set cookies as soon as they load. If you serve UK or
          EU visitors, add a consent banner before enabling those two.
        </span>
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => void save()}
          disabled={busy}
          className="cursor-pointer rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        {msg && <span className="text-xs text-emerald-700">{msg}</span>}
        {err && <span className="text-xs text-red-600">{err}</span>}
      </div>
    </div>
  );
}
