"use client";

import { withBase } from "@/lib/base-path";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Download, ExternalLink, ShieldCheck, Trash2 } from "lucide-react";

type Lead = {
  id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  website: string | null;
  services: string[];
  budget: string | null;
  timeline: string | null;
  message: string | null;
  source: string;
  status: string;
  verified: boolean;
  notes: string | null;
  createdAt: string;
};

const STATUSES = ["ALL", "NEW", "VERIFIED", "QUALIFIED", "WON", "LOST"] as const;

const STATUS_TONES: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  VERIFIED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  QUALIFIED: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  WON: "bg-emerald-600 text-white",
  LOST: "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
};

export default function LeadsManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<(typeof STATUSES)[number]>("ALL");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const reload = useCallback(async () => {
    const res = await fetch(withBase(`/api/leads?status=${filter}`));
    const data = await res.json();
    if (data.ok) setLeads(data.leads);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      void reload();
    }, 0);
    return () => clearTimeout(t);
  }, [reload]);

  const patch = async (id: string, body: object) => {
    await fetch(withBase(`/api/leads/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await reload();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === s
                ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                : "border border-stone-200 text-stone-600 hover:border-orange-400 dark:border-stone-700 dark:text-stone-300"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
        <button
          onClick={() => { window.location.href = withBase(`/api/leads?status=${filter}&format=csv`); }}
          className="ml-auto flex cursor-pointer items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:border-orange-400 dark:border-stone-700 dark:text-stone-300"
        >
          <Download size={13} /> Export CSV
        </button>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-stone-500">Loading leads…</p>
      ) : leads.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500 dark:border-stone-700">
          No leads {filter !== "ALL" ? `with status ${filter}` : "yet"}. They arrive from the contact page, the audit band and the estimator.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-xs uppercase tracking-wide text-stone-400 dark:border-stone-800">
                <th className="px-4 py-2.5">Lead</th>
                <th className="px-4 py-2.5">Interested in</th>
                <th className="px-4 py-2.5">Budget</th>
                <th className="px-4 py-2.5">Source</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <Fragment key={l.id}>
                  <tr
                    onClick={() => { setOpen(open === l.id ? null : l.id); setNoteDraft(l.notes ?? ""); }}
                    className="cursor-pointer border-b border-stone-50 align-top transition-colors hover:bg-orange-50/40 dark:border-stone-800/60 dark:hover:bg-stone-800/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-semibold text-stone-900 dark:text-stone-100">
                        {l.name}
                        {l.verified && <ShieldCheck size={13} className="text-emerald-600" aria-label="WhatsApp verified" />}
                      </div>
                      <a
                        href={`https://wa.me/${l.whatsapp.replace(/^\+/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-emerald-700 hover:underline dark:text-emerald-400"
                      >
                        {l.whatsapp} ↗
                      </a>
                      <div className="text-xs text-stone-400">{new Date(l.createdAt).toLocaleString("en-IN")}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-600 dark:text-stone-300">{l.services.join(", ") || "—"}</td>
                    <td className="px-4 py-3 text-xs text-stone-600 dark:text-stone-300">{l.budget ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-stone-500">{l.source}</td>
                    <td className="px-4 py-3">
                      <select
                        value={l.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => void patch(l.id, { status: e.target.value })}
                        className={`cursor-pointer rounded-full border-none px-2.5 py-1 text-xs font-bold outline-none ${STATUS_TONES[l.status] ?? ""}`}
                      >
                        {STATUSES.filter((s) => s !== "ALL").map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); if (confirm(`Delete lead "${l.name}"?`)) void fetch(withBase(`/api/leads/${l.id}`), { method: "DELETE" }).then(reload); }}
                        className="cursor-pointer text-stone-300 hover:text-red-600"
                        aria-label="Delete lead"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                  {open === l.id && (
                    <tr className="border-b border-stone-100 bg-stone-50/60 dark:border-stone-800 dark:bg-stone-950/40">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="grid gap-3 text-xs text-stone-600 dark:text-stone-300 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            {l.email && <p><b className="font-semibold">Email:</b> {l.email}</p>}
                            {l.website && (
                              <p className="flex items-center gap-1">
                                <b className="font-semibold">Website:</b> {l.website}
                                <a href={l.website.startsWith("http") ? l.website : `https://${l.website}`} target="_blank" rel="noopener noreferrer" className="text-orange-600"><ExternalLink size={11} /></a>
                              </p>
                            )}
                            {l.timeline && <p><b className="font-semibold">Timeline:</b> {l.timeline}</p>}
                            {l.message && <p className="whitespace-pre-wrap"><b className="font-semibold">Message:</b> {l.message}</p>}
                          </div>
                          <div>
                            <label className="mb-1 block font-semibold">Internal notes</label>
                            <textarea
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              className="min-h-16 w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-950"
                            />
                            <button
                              onClick={() => void patch(l.id, { notes: noteDraft || null })}
                              className="mt-1 cursor-pointer rounded-lg bg-stone-900 px-3 py-1 text-xs font-bold text-white dark:bg-stone-100 dark:text-stone-900"
                            >
                              Save note
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
