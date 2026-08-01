"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { FileText, Sparkles } from "lucide-react";
import { withBase } from "@/lib/base-path";
import LeadFollowUps, { type FollowUp } from "@/components/admin/LeadFollowUps";
import LeadComms from "@/components/admin/LeadComms";
import Attachments from "@/components/admin/Attachments";
import LeadInsights from "@/components/admin/LeadInsights";
import {
  LEAD_PRIORITIES,
  LEAD_STATUSES,
  PRIORITY_LABEL,
  PRIORITY_STYLE,
  STATUS_LABEL,
  STATUS_STYLE,
  sourceLabel,
} from "@/lib/crm";
import {
  BAND_LABEL,
  BAND_STYLE,
  computeScore,
  type ScoringConfig,
} from "@/lib/scoring";

type Activity = {
  id: string;
  type: string;
  message: string;
  userName: string | null;
  createdAt: string;
};

type Lead = {
  id: string;
  name: string;
  company: string | null;
  industry: string | null;
  whatsapp: string;
  email: string | null;
  website: string | null;
  telegram: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  source: string;
  status: string;
  priority: string;
  score: number | null;
  expectedRevenue: number | null;
  budget: string | null;
  timeline: string | null;
  message: string | null;
  notes: string | null;
  campaign: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  heardFrom: string | null;
  services: string[];
  tags: string[];
  verified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  assignedToId: string | null;
  assignedTo: { id: string; name: string } | null;
  activities: Activity[];
  followUps: FollowUp[];
};

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

export default function LeadDetail({
  lead: initial,
  assignees,
  scoringConfig,
  canQuote = false,
  senderName = "",
}: {
  lead: Lead;
  assignees: { id: string; name: string }[];
  scoringConfig: ScoringConfig;
  canQuote?: boolean;
  senderName?: string;
}) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead>(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    const res = await fetch(withBase(`/api/leads/${initial.id}`));
    const json = await res.json().catch(() => ({}));
    if (json.ok) setLead({ ...json.lead, createdAt: json.lead.createdAt });
  }, [initial.id]);

  const patch = useCallback(
    async (body: Record<string, unknown>) => {
      setSaving(true);
      try {
        await fetch(withBase(`/api/leads/${initial.id}`), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        await reload();
      } finally {
        setSaving(false);
      }
    },
    [initial.id, reload],
  );

  async function remove() {
    if (!window.confirm(`Delete lead "${lead.name}"?`)) return;
    await fetch(withBase(`/api/leads/${initial.id}`), { method: "DELETE" }).catch(() => {});
    router.push("/admin/leads");
  }

  return (
    <div>
      <Link href="/admin/leads" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-orange-600">
        <ArrowLeft size={15} /> All leads
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">{lead.name}</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {lead.company ? `${lead.company} · ` : ""}
            {sourceLabel(lead.source)} · added {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canQuote && (
            <Link
              href={`/admin/quotations/new?leadId=${initial.id}`}
              className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-600 hover:border-orange-400 hover:text-orange-600 dark:border-stone-700 dark:text-stone-300"
            >
              <FileText size={14} /> Quote
            </Link>
          )}
          <a
            href={`https://wa.me/${lead.whatsapp.replace(/[^\d]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1fb457]"
          >
            <MessageCircle size={14} /> WhatsApp
          </a>
          <button onClick={remove} className="rounded-lg border border-stone-300 p-2 text-stone-400 hover:border-red-400 hover:text-red-600 dark:border-stone-700" aria-label="Delete lead">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-4 flex flex-wrap gap-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <label className="text-xs">
          <span className="mb-1 block font-semibold uppercase tracking-wide text-stone-500">Status</span>
          <select value={lead.status} disabled={saving} onChange={(e) => void patch({ status: e.target.value })} className={`${inputCls} ${STATUS_STYLE[lead.status as keyof typeof STATUS_STYLE] ?? ""}`}>
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </label>
        <label className="text-xs">
          <span className="mb-1 block font-semibold uppercase tracking-wide text-stone-500">Priority</span>
          <select value={lead.priority} disabled={saving} onChange={(e) => void patch({ priority: e.target.value })} className={`${inputCls} ${PRIORITY_STYLE[lead.priority as keyof typeof PRIORITY_STYLE] ?? ""}`}>
            {LEAD_PRIORITIES.map((s) => <option key={s} value={s}>{PRIORITY_LABEL[s]}</option>)}
          </select>
        </label>
        <label className="text-xs">
          <span className="mb-1 block font-semibold uppercase tracking-wide text-stone-500">Assigned to</span>
          <select value={lead.assignedToId ?? ""} disabled={saving} onChange={(e) => void patch({ assignedToId: e.target.value || null })} className={inputCls}>
            <option value="">Unassigned</option>
            {assignees.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
        <div className="text-xs">
          <span className="mb-1 block font-semibold uppercase tracking-wide text-stone-500">Score</span>
          {(() => {
            const r = computeScore({ ...lead, activityCount: lead.activities.length }, scoringConfig);
            return (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 dark:border-stone-700">
                <span className="text-sm font-bold tabular-nums">{r.score}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${BAND_STYLE[r.band]}`}>{BAND_LABEL[r.band]}</span>
              </span>
            );
          })()}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {/* Details */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold">Details</h2>
              <button onClick={() => setEditing((v) => !v)} className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline">
                <Pencil size={12} /> {editing ? "Cancel" : "Edit"}
              </button>
            </div>
            {editing ? (
              <EditForm lead={lead} onSave={async (body) => { await patch(body); setEditing(false); }} />
            ) : (
              <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <Row label="Email" value={lead.email} verified={lead.emailVerified} />
                <Row label="WhatsApp" value={lead.whatsapp} verified={lead.phoneVerified} />
                <Row label="Website" value={lead.website} />
                <Row label="Industry" value={lead.industry} />
                <Row label="City" value={lead.city} />
                <Row label="State" value={lead.state} />
                <Row label="Country" value={lead.country} />
                <Row label="Address" value={lead.address} />
                <Row label="Budget" value={lead.budget} />
                <Row label="Expected revenue" value={lead.expectedRevenue != null ? `₹${lead.expectedRevenue.toLocaleString("en-IN")}` : null} />
                <Row label="Timeline" value={lead.timeline} />
                <Row label="Services" value={lead.services.join(", ") || null} />
                <Row label="Tags" value={lead.tags.join(", ") || null} />
                <Row label="Campaign" value={lead.campaign} />
                <Row label="UTM source" value={lead.utmSource} />
                <Row label="UTM medium" value={lead.utmMedium} />
                <Row label="UTM campaign" value={lead.utmCampaign} />
                <Row label="Found us via" value={lead.heardFrom} />
                {lead.message && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-stone-400">Message</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap text-stone-700 dark:text-stone-200">{lead.message}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          {/* Communications */}
          <LeadComms
            leadId={initial.id}
            senderName={senderName}
            lead={{
              name: lead.name, company: lead.company, email: lead.email, whatsapp: lead.whatsapp,
              telegram: lead.telegram,
              city: lead.city, country: lead.country, services: lead.services, budget: lead.budget,
            }}
          />

          {/* Score */}
          <ScoreCard leadId={initial.id} lead={lead} config={scoringConfig} />

          {/* AI brief + duplicates */}
          <LeadInsights leadId={initial.id} />

          {/* Follow-ups */}
          <LeadFollowUps
            leadId={initial.id}
            followUps={lead.followUps}
            assignees={assignees}
            onChanged={reload}
          />

          {/* Files */}
          <Attachments leadId={initial.id} />

          {/* Notes */}
          <NotesCard notes={lead.notes} onSave={(v) => patch({ notes: v || null })} />
        </div>

        {/* Activity */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="font-display text-sm font-bold">Activity</h2>
          <ActivityComposer leadId={initial.id} onAdded={reload} />
          <ol className="mt-4 space-y-3 border-l border-stone-200 pl-4 dark:border-stone-800">
            {lead.activities.length === 0 && <li className="text-xs text-stone-400">No activity yet.</li>}
            {lead.activities.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-orange-500" aria-hidden />
                <p className="text-sm text-stone-700 dark:text-stone-200">{a.message}</p>
                <p className="text-[11px] text-stone-400">
                  {a.userName ? `${a.userName} · ` : ""}
                  {new Date(a.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function VerifiedChip() {
  return (
    <span
      title="Confirmed by the lead via one-time code"
      className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
    >
      <BadgeCheck size={11} aria-hidden /> Verified
    </span>
  );
}

function Row({ label, value, verified }: { label: string; value: string | null; verified?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-stone-400">{label}</dt>
      <dd className="flex flex-wrap items-center gap-1.5 text-stone-700 dark:text-stone-200">
        {value}
        {verified && <VerifiedChip />}
      </dd>
    </div>
  );
}

function EditForm({ lead, onSave }: { lead: Lead; onSave: (body: Record<string, unknown>) => Promise<void> }) {
  const [f, setF] = useState({
    name: lead.name, company: lead.company ?? "", industry: lead.industry ?? "",
    email: lead.email ?? "", whatsapp: lead.whatsapp, website: lead.website ?? "",
    country: lead.country ?? "", state: lead.state ?? "", city: lead.city ?? "", address: lead.address ?? "",
    budget: lead.budget ?? "", timeline: lead.timeline ?? "",
    expectedRevenue: lead.expectedRevenue?.toString() ?? "",
    tags: lead.tags.join(", "), message: lead.message ?? "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const flds: [keyof typeof f, string][] = [
    ["name", "Name"], ["company", "Company"], ["industry", "Industry"], ["email", "Email"],
    ["whatsapp", "WhatsApp"], ["website", "Website"], ["city", "City"], ["state", "State"],
    ["country", "Country"], ["address", "Address"], ["budget", "Budget"], ["timeline", "Timeline"],
    ["expectedRevenue", "Expected revenue (₹)"], ["tags", "Tags (comma-separated)"],
  ];

  async function save() {
    setBusy(true);
    const body: Record<string, unknown> = {
      name: f.name,
      company: f.company || null, industry: f.industry || null, email: f.email || null,
      whatsapp: f.whatsapp, website: f.website || null, country: f.country || null,
      state: f.state || null, city: f.city || null, address: f.address || null,
      budget: f.budget || null, timeline: f.timeline || null, message: f.message || null,
      expectedRevenue: f.expectedRevenue ? Number(f.expectedRevenue) : null,
      tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    await onSave(body);
    setBusy(false);
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {flds.map(([k, label]) => (
        <div key={k}>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">{label}</label>
          <input value={f[k]} onChange={(e) => set(k, e.target.value)} className={inputCls} />
        </div>
      ))}
      <div className="col-span-2">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">Message</label>
        <textarea value={f.message} onChange={(e) => set("message", e.target.value)} rows={2} className={inputCls} />
      </div>
      <div className="col-span-2">
        <button onClick={() => void save()} disabled={busy || !f.name} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50">
          {busy ? "Saving…" : "Save details"}
        </button>
      </div>
    </div>
  );
}

function NotesCard({ notes, onSave }: { notes: string | null; onSave: (v: string) => Promise<void> }) {
  const [v, setV] = useState(notes ?? "");
  const [busy, setBusy] = useState(false);
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
      <h2 className="font-display text-sm font-bold">Internal notes</h2>
      <textarea value={v} onChange={(e) => setV(e.target.value)} rows={3} className={`${inputCls} mt-3`} placeholder="Private notes for the team…" />
      <button onClick={async () => { setBusy(true); await onSave(v); setBusy(false); }} disabled={busy} className="mt-2 rounded-lg bg-stone-900 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900">
        {busy ? "Saving…" : "Save notes"}
      </button>
    </div>
  );
}

function ScoreCard({ leadId, lead, config }: { leadId: string; lead: Lead; config: ScoringConfig }) {
  const result = computeScore({ ...lead, activityCount: lead.activities.length }, config);
  const [ai, setAi] = useState<{ score: number; reason: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function runAi() {
    setBusy(true); setErr(""); setAi(null);
    try {
      const res = await fetch(withBase(`/api/leads/${leadId}/ai-score`), { method: "POST" });
      const json = await res.json();
      if (json.ok) setAi({ score: json.score, reason: json.reason });
      else setErr(json.error ?? "AI scoring failed.");
    } catch {
      setErr("AI scoring failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold">Lead score</h2>
        <button onClick={() => void runAi()} disabled={busy} className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-2.5 py-1 text-xs font-semibold text-stone-600 hover:border-orange-400 hover:text-orange-600 disabled:opacity-50 dark:border-stone-700 dark:text-stone-300">
          <Sparkles size={13} /> {busy ? "Scoring…" : "AI score"}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800">
          <span className="text-2xl font-extrabold tabular-nums leading-none">{result.score}</span>
          <span className="text-[9px] font-semibold uppercase text-stone-400">/ 100</span>
        </div>
        <div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${BAND_STYLE[result.band]}`}>{BAND_LABEL[result.band]}</span>
          <p className="mt-1 text-[11px] text-stone-400">Auto-scored from {result.breakdown.length} signal{result.breakdown.length === 1 ? "" : "s"}.</p>
        </div>
      </div>

      {result.breakdown.length > 0 && (
        <ul className="mt-3 space-y-1">
          {result.breakdown.map((b) => (
            <li key={b.key} className="flex items-center justify-between text-xs">
              <span className="text-stone-600 dark:text-stone-300">{b.label}</span>
              <span className={`font-semibold tabular-nums ${b.points < 0 ? "text-red-500" : "text-green-600"}`}>{b.points > 0 ? "+" : ""}{b.points}</span>
            </li>
          ))}
        </ul>
      )}

      {err && <p className="mt-3 text-xs text-red-500">{err}</p>}
      {ai && (
        <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/40">
          <p className="flex items-center gap-1.5 text-xs font-bold text-orange-800 dark:text-orange-300">
            <Sparkles size={12} /> AI conversion score: {ai.score}/100
          </p>
          <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">{ai.reason}</p>
        </div>
      )}
    </div>
  );
}

function ActivityComposer({ leadId, onAdded }: { leadId: string; onAdded: () => Promise<void> }) {
  const [type, setType] = useState("note");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function add() {
    if (!msg.trim()) return;
    setBusy(true);
    try {
      await fetch(withBase(`/api/leads/${leadId}/activity`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message: msg.trim() }),
      });
      setMsg("");
      await onAdded();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-2">
        <select value={type} onChange={(e) => setType(e.target.value)} className={`${inputCls} w-28`}>
          <option value="note">Note</option>
          <option value="call">Call</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="email">Email</option>
          <option value="meeting">Meeting</option>
        </select>
        <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void add(); }} placeholder="Log an interaction…" className={inputCls} />
      </div>
      <button onClick={() => void add()} disabled={busy || !msg.trim()} className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-500 disabled:opacity-50">
        {busy ? "Adding…" : "Add to timeline"}
      </button>
    </div>
  );
}
