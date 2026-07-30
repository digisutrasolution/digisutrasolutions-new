"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Monitor, Smartphone, Tablet, Trash2 } from "lucide-react";
import { withBase } from "@/lib/base-path";

type Session = {
  id: string;
  startedAt: string;
  lastSeenAt: string;
  pageCount: number;
  landingPath: string;
  exitPath: string;
  referrer: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
};

type View = { id: string; path: string; createdAt: string };

const inputCls =
  "rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs outline-none transition-colors focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

function flag(code: string | null): string {
  if (!code || code.length !== 2) return "🌐";
  const A = 0x1f1e6;
  return String.fromCodePoint(
    A + code.charCodeAt(0) - 65,
    A + code.charCodeAt(1) - 65,
  );
}

function duration(startIso: string, endIso: string): string {
  const s = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000);
  if (s <= 0) return "—";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ${s % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function DeviceIcon({ device }: { device: string | null }) {
  const cls = "text-stone-500 dark:text-stone-400";
  if (device === "mobile") return <Smartphone size={15} className={cls} aria-hidden />;
  if (device === "tablet") return <Tablet size={15} className={cls} aria-hidden />;
  return <Monitor size={15} className={cls} aria-hidden />;
}

export default function SessionsExplorer() {
  const [q, setQ] = useState("");
  const [device, setDevice] = useState("");
  const [country, setCountry] = useState("");
  const [minPages, setMinPages] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [journey, setJourney] = useState<Record<string, View[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (q) params.set("q", q);
    if (device) params.set("device", device);
    if (country) params.set("country", country);
    if (minPages) params.set("minPages", minPages);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    try {
      const res = await fetch(withBase(`/api/sessions?${params.toString()}`));
      const json = await res.json();
      if (json.ok) {
        setSessions(json.sessions);
        setTotal(json.total);
        setPages(json.pages);
        if (json.countries.length) setCountries(json.countries);
      }
    } catch {
      /* transient */
    } finally {
      setLoading(false);
    }
  }, [page, q, device, country, minPages, from, to]);

  // Debounce so typing in search / changing filters doesn't spam the API.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(load, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load]);

  // Filter setters reset to page 1 (done here rather than in an effect to
  // avoid a synchronous setState-in-effect cascade).
  const onQ = (v: string) => { setQ(v); setPage(1); };
  const onDevice = (v: string) => { setDevice(v); setPage(1); };
  const onCountry = (v: string) => { setCountry(v); setPage(1); };
  const onMinPages = (v: string) => { setMinPages(v); setPage(1); };
  const onFrom = (v: string) => { setFrom(v); setPage(1); };
  const onTo = (v: string) => { setTo(v); setPage(1); };

  async function toggle(id: string) {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!journey[id]) {
      const res = await fetch(withBase(`/api/sessions/${id}`));
      const json = await res.json().catch(() => ({}));
      if (json.ok) setJourney((j) => ({ ...j, [id]: json.session.views }));
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this session and its pageviews?")) return;
    await fetch(withBase(`/api/sessions/${id}`), { method: "DELETE" }).catch(() => {});
    setSessions((s) => s.filter((x) => x.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }

  function reset() {
    setPage(1);
    setQ("");
    setDevice("");
    setCountry("");
    setMinPages("");
    setFrom("");
    setTo("");
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2">
        <input
          value={q}
          onChange={(e) => onQ(e.target.value)}
          placeholder="Search path or referrer…"
          className={`${inputCls} min-w-52 flex-1`}
        />
        <select value={device} onChange={(e) => onDevice(e.target.value)} className={inputCls} aria-label="Device">
          <option value="">All devices</option>
          <option value="desktop">Desktop</option>
          <option value="mobile">Mobile</option>
          <option value="tablet">Tablet</option>
        </select>
        <select value={country} onChange={(e) => onCountry(e.target.value)} className={inputCls} aria-label="Country">
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>{flag(c)} {c}</option>
          ))}
        </select>
        <input
          type="number"
          min={2}
          value={minPages}
          onChange={(e) => onMinPages(e.target.value)}
          placeholder="Min pages"
          className={`${inputCls} w-24`}
          aria-label="Minimum pages"
        />
        <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} className={inputCls} aria-label="From date" />
        <input type="date" value={to} onChange={(e) => onTo(e.target.value)} className={inputCls} aria-label="To date" />
        <button
          onClick={reset}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:border-orange-500 hover:text-orange-700 dark:border-stone-700 dark:text-stone-300"
        >
          Reset
        </button>
      </div>

      <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
        {loading ? "Loading…" : `${total.toLocaleString("en-IN")} session${total === 1 ? "" : "s"}`}
      </p>

      <div className="mt-2 overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-800">
        <table className="w-full min-w-[820px] text-left text-xs">
          <thead className="bg-stone-50 uppercase tracking-wide text-stone-500 dark:bg-stone-900/50">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Started</th>
              <th className="px-4 py-2.5 font-semibold">Device</th>
              <th className="px-4 py-2.5 font-semibold">Country</th>
              <th className="px-4 py-2.5 font-semibold">Journey</th>
              <th className="px-4 py-2.5 font-semibold">Pages</th>
              <th className="px-4 py-2.5 font-semibold">Duration</th>
              <th className="px-4 py-2.5 font-semibold">Referrer</th>
              <th className="px-4 py-2.5 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-stone-500">
                  No sessions match these filters yet.
                </td>
              </tr>
            )}
            {sessions.map((s) => (
              <Fragment key={s.id}>
                <tr
                  className="border-t border-stone-100 hover:bg-orange-50/40 dark:border-stone-800 dark:hover:bg-stone-800/40"
                >
                  <td className="whitespace-nowrap px-4 py-2.5 text-stone-600 dark:text-stone-300">{when(s.startedAt)}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <span className="flex items-center gap-1.5">
                      <DeviceIcon device={s.device} />
                      <span className="text-stone-600 dark:text-stone-300">{s.browser ?? "—"}</span>
                      <span className="text-stone-400">· {s.os ?? "—"}</span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    {s.country ? `${flag(s.country)} ${s.country}` : "🌐 —"}
                  </td>
                  <td className="max-w-[240px] truncate px-4 py-2.5" title={`${s.landingPath} → ${s.exitPath}`}>
                    <span className="font-medium text-stone-700 dark:text-stone-200">{s.landingPath}</span>
                    {s.exitPath !== s.landingPath && (
                      <span className="text-stone-400"> → {s.exitPath}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-stone-700 dark:text-stone-200">{s.pageCount}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-stone-600 dark:text-stone-300">{duration(s.startedAt, s.lastSeenAt)}</td>
                  <td className="max-w-[140px] truncate px-4 py-2.5 text-stone-500" title={s.referrer ?? "direct"}>{s.referrer ?? "direct"}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => void toggle(s.id)}
                        aria-label="View journey"
                        className="rounded p-1 text-stone-400 hover:text-orange-600"
                      >
                        <ChevronDown size={15} className={`transition-transform ${expanded === s.id ? "rotate-180" : ""}`} aria-hidden />
                      </button>
                      <button
                        onClick={() => void remove(s.id)}
                        aria-label="Delete session"
                        className="rounded p-1 text-stone-400 hover:text-red-600"
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
                {expanded === s.id && (
                  <tr key={`${s.id}-journey`} className="bg-stone-50/60 dark:bg-stone-900/40">
                    <td colSpan={8} className="px-4 py-3">
                      {!journey[s.id] ? (
                        <p className="text-stone-500">Loading journey…</p>
                      ) : (
                        <ol className="space-y-1.5">
                          {journey[s.id].map((v, i) => (
                            <li key={v.id} className="flex items-center gap-3">
                              <span className="w-5 shrink-0 text-right text-[11px] font-semibold text-orange-600">{i + 1}</span>
                              <span className="font-medium text-stone-700 dark:text-stone-200">{v.path}</span>
                              <span className="text-[11px] text-stone-400">
                                {new Date(v.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                              </span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-stone-300 px-3 py-1.5 font-semibold text-stone-600 disabled:opacity-40 dark:border-stone-700 dark:text-stone-300"
          >
            ← Prev
          </button>
          <span className="text-stone-500">Page {page} of {pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="rounded-lg border border-stone-300 px-3 py-1.5 font-semibold text-stone-600 disabled:opacity-40 dark:border-stone-700 dark:text-stone-300"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
