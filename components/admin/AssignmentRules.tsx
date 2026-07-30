"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { withBase } from "@/lib/base-path";
import {
  LEAD_PRIORITIES,
  LEAD_SOURCES,
  PRIORITY_LABEL,
  SOURCE_LABEL,
  priorityLabel,
  sourceLabel,
} from "@/lib/crm";

type Assignee = { id: string; name: string };
type Rule = {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  sources: string[];
  services: string[];
  countries: string[];
  states: string[];
  cities: string[];
  priorities: string[];
  keyword: string | null;
  targetUserIds: string[];
  matchCount: number;
};

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
const chip = (on: boolean) =>
  `cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
    on
      ? "border-orange-500 bg-orange-500 text-white"
      : "border-stone-300 text-stone-500 hover:border-orange-400 dark:border-stone-700 dark:text-stone-400"
  }`;

const csv = (arr: string[]) => arr.join(", ");
const parseCsv = (s: string) =>
  s.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 40);

export default function AssignmentRules({
  initialRules,
  assignees,
}: {
  initialRules: Rule[];
  assignees: Assignee[];
}) {
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const nameOf = (id: string) => assignees.find((a) => a.id === id)?.name ?? "—";

  async function reload() {
    const res = await fetch(withBase("/api/leads/assignment-rules"));
    const json = await res.json();
    if (json.ok) setRules(json.rules);
  }

  async function save(body: Partial<Rule>, id?: string) {
    setBusy(true);
    try {
      const res = await fetch(
        withBase(id ? `/api/leads/assignment-rules/${id}` : "/api/leads/assignment-rules"),
        {
          method: id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        alert(json.error ?? "Save failed.");
        return false;
      }
      await reload();
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function toggle(rule: Rule) {
    await save({ enabled: !rule.enabled }, rule.id);
  }

  async function remove(rule: Rule) {
    if (!window.confirm(`Delete rule "${rule.name}"?`)) return;
    setBusy(true);
    try {
      await fetch(withBase(`/api/leads/assignment-rules/${rule.id}`), { method: "DELETE" });
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const other = index + dir;
    if (other < 0 || other >= rules.length) return;
    const a = rules[index];
    const b = rules[other];
    setBusy(true);
    try {
      await Promise.all([
        fetch(withBase(`/api/leads/assignment-rules/${a.id}`), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: b.order }) }),
        fetch(withBase(`/api/leads/assignment-rules/${b.id}`), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: a.order }) }),
      ]);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => { setAdding(true); setEditingId(null); }}
          className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-orange-500"
        >
          <Plus size={15} /> New rule
        </button>
        <Tester assignees={assignees} />
      </div>

      {adding && (
        <RuleEditor
          assignees={assignees}
          initial={null}
          busy={busy}
          onCancel={() => setAdding(false)}
          onSave={async (body) => { if (await save(body)) setAdding(false); }}
        />
      )}

      {rules.length === 0 && !adding && (
        <p className="rounded-2xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-400 dark:border-stone-700">
          No rules yet. New enquiries stay unassigned until you add one.
        </p>
      )}

      <ol className="space-y-3">
        {rules.map((rule, i) => (
          <li key={rule.id} className="rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center gap-3 p-4">
              <div className="flex flex-col">
                <button onClick={() => void move(i, -1)} disabled={busy || i === 0} className="text-stone-300 hover:text-orange-600 disabled:opacity-30" aria-label="Move up"><ChevronUp size={16} /></button>
                <button onClick={() => void move(i, 1)} disabled={busy || i === rules.length - 1} className="text-stone-300 hover:text-orange-600 disabled:opacity-30" aria-label="Move down"><ChevronDown size={16} /></button>
              </div>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-500 dark:bg-stone-800">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate font-semibold text-stone-900 dark:text-stone-100">
                  {rule.name}
                  {!rule.enabled && <span className="rounded-full bg-stone-200 px-1.5 py-0.5 text-[10px] font-bold text-stone-500 dark:bg-stone-700">Off</span>}
                </p>
                <p className="mt-0.5 truncate text-xs text-stone-500">
                  {summarize(rule)} <span className="text-stone-300">·</span>{" "}
                  <span className="inline-flex items-center gap-1"><Users size={11} /> {rule.targetUserIds.map(nameOf).join(", ") || "no one"}</span>
                  {rule.matchCount > 0 && <span className="text-stone-300"> · {rule.matchCount} routed</span>}
                </p>
              </div>
              <button onClick={() => void toggle(rule)} disabled={busy} title={rule.enabled ? "Disable" : "Enable"} className={`relative h-5 w-9 rounded-full transition-colors ${rule.enabled ? "bg-orange-500" : "bg-stone-300 dark:bg-stone-700"}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${rule.enabled ? "left-4" : "left-0.5"}`} />
              </button>
              <button onClick={() => { setEditingId(editingId === rule.id ? null : rule.id); setAdding(false); }} className="rounded-lg border border-stone-300 p-2 text-stone-400 hover:border-orange-400 hover:text-orange-600 dark:border-stone-700" aria-label="Edit"><Pencil size={14} /></button>
              <button onClick={() => void remove(rule)} disabled={busy} className="rounded-lg border border-stone-300 p-2 text-stone-400 hover:border-red-400 hover:text-red-600 dark:border-stone-700" aria-label="Delete"><Trash2 size={14} /></button>
            </div>
            {editingId === rule.id && (
              <div className="border-t border-stone-200 p-4 dark:border-stone-800">
                <RuleEditor
                  assignees={assignees}
                  initial={rule}
                  busy={busy}
                  onCancel={() => setEditingId(null)}
                  onSave={async (body) => { if (await save(body, rule.id)) setEditingId(null); }}
                />
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function summarize(r: Rule): string {
  const parts: string[] = [];
  if (r.sources.length) parts.push(r.sources.map(sourceLabel).join("/"));
  if (r.priorities.length) parts.push(r.priorities.map(priorityLabel).join("/"));
  if (r.services.length) parts.push(`svc: ${r.services.join("/")}`);
  const geo = [...r.countries, ...r.states, ...r.cities];
  if (geo.length) parts.push(geo.join("/"));
  if (r.keyword) parts.push(`"${r.keyword}"`);
  return parts.length ? parts.join(" · ") : "Any lead";
}

/* ---------------- Rule editor ---------------- */

function RuleEditor({
  assignees,
  initial,
  busy,
  onSave,
  onCancel,
}: {
  assignees: Assignee[];
  initial: Rule | null;
  busy: boolean;
  onSave: (body: Partial<Rule>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [sources, setSources] = useState<string[]>(initial?.sources ?? []);
  const [priorities, setPriorities] = useState<string[]>(initial?.priorities ?? []);
  const [services, setServices] = useState(csv(initial?.services ?? []));
  const [countries, setCountries] = useState(csv(initial?.countries ?? []));
  const [states, setStates] = useState(csv(initial?.states ?? []));
  const [cities, setCities] = useState(csv(initial?.cities ?? []));
  const [keyword, setKeyword] = useState(initial?.keyword ?? "");
  const [targets, setTargets] = useState<string[]>(initial?.targetUserIds ?? []);

  const toggleIn = (list: string[], setList: (v: string[]) => void, v: string) =>
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const canSave = name.trim().length > 0 && targets.length > 0;

  function submit() {
    onSave({
      name: name.trim(),
      sources,
      priorities,
      services: parseCsv(services),
      countries: parseCsv(countries),
      states: parseCsv(states),
      cities: parseCsv(cities),
      keyword: keyword.trim() || null,
      targetUserIds: targets,
    });
  }

  return (
    <div className="space-y-4 rounded-xl border border-stone-200 bg-stone-50/60 p-4 dark:border-stone-800 dark:bg-stone-950/40">
      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">Rule name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. PPC leads → sales pod" className={inputCls} autoFocus />
      </div>

      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500">When source is</p>
        <div className="flex flex-wrap gap-1.5">
          {LEAD_SOURCES.map((s) => (
            <button key={s} type="button" onClick={() => toggleIn(sources, setSources, s)} className={chip(sources.includes(s))}>{SOURCE_LABEL[s]}</button>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-stone-400">None selected = any source.</p>
      </div>

      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500">And priority is</p>
        <div className="flex flex-wrap gap-1.5">
          {LEAD_PRIORITIES.map((p) => (
            <button key={p} type="button" onClick={() => toggleIn(priorities, setPriorities, p)} className={chip(priorities.includes(p))}>{PRIORITY_LABEL[p]}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="And service includes (comma-separated)" value={services} onChange={setServices} placeholder="SEO, Web development" />
        <Field label="And keyword appears in the enquiry" value={keyword} onChange={setKeyword} placeholder="e.g. urgent, ecommerce" />
        <Field label="And country is" value={countries} onChange={setCountries} placeholder="India, UAE" />
        <Field label="And state is" value={states} onChange={setStates} placeholder="Maharashtra" />
        <Field label="And city is" value={cities} onChange={setCities} placeholder="Mumbai, Pune" />
      </div>

      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500">Assign to (round-robin across the pool)</p>
        <div className="flex flex-wrap gap-1.5">
          {assignees.map((a) => (
            <button key={a.id} type="button" onClick={() => toggleIn(targets, setTargets, a.id)} className={chip(targets.includes(a.id))}>{a.name}</button>
          ))}
        </div>
        {targets.length === 0 && <p className="mt-1 text-[10px] text-red-500">Pick at least one person.</p>}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={submit} disabled={busy || !canSave} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50">
          {busy ? "Saving…" : initial ? "Save rule" : "Create rule"}
        </button>
        <button onClick={onCancel} className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-500 hover:text-stone-800 dark:border-stone-700">Cancel</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </div>
  );
}

/* ---------------- Tester ---------------- */

function Tester({ assignees }: { assignees: Assignee[] }) {
  void assignees;
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState("CONTACT");
  const [priority, setPriority] = useState("MEDIUM");
  const [services, setServices] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [text, setText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(withBase("/api/leads/assignment-rules/test"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, priority, services: parseCsv(services), country: country || undefined, city: city || undefined, text: text || undefined }),
      });
      const json = await res.json();
      if (!json.ok) setResult("Test failed.");
      else if (!json.matched) setResult("No rule matches — this lead would stay unassigned.");
      else setResult(`Matched "${json.ruleName}" → ${json.ownerName ?? "no available owner"}.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3.5 py-2 text-sm font-semibold text-stone-600 hover:border-orange-400 hover:text-orange-600 dark:border-stone-700 dark:text-stone-300">
        <FlaskConical size={15} /> Test a lead
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-2 w-80 space-y-2 rounded-xl border border-stone-200 bg-white p-3 shadow-lg dark:border-stone-800 dark:bg-stone-900">
          <div className="flex gap-2">
            <select value={source} onChange={(e) => setSource(e.target.value)} className={`${inputCls} text-xs`}>
              {LEAD_SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={`${inputCls} text-xs`}>
              {LEAD_PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
            </select>
          </div>
          <input value={services} onChange={(e) => setServices(e.target.value)} placeholder="Services (comma-separated)" className={`${inputCls} text-xs`} />
          <div className="flex gap-2">
            <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" className={`${inputCls} text-xs`} />
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className={`${inputCls} text-xs`} />
          </div>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message / keyword text" className={`${inputCls} text-xs`} />
          <button onClick={() => void run()} disabled={busy} className="w-full rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900">
            {busy ? "Testing…" : "Run test"}
          </button>
          {result && <p className="rounded-lg bg-orange-50 p-2 text-xs text-orange-800 dark:bg-orange-950 dark:text-orange-300">{result}</p>}
        </div>
      )}
    </div>
  );
}
