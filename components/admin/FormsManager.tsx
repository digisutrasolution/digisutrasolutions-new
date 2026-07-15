"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Inbox, Plus, Trash2 } from "lucide-react";
import type { FormField } from "@/lib/cms/forms";

type FormRow = {
  id: string;
  name: string;
  slug: string;
  fields: FormField[];
  notifyEmail: string | null;
  isActive: boolean;
  submissionCount: number;
};

type Submission = {
  id: string;
  data: Record<string, string>;
  createdAt: string;
};

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs outline-none transition-colors focus:border-orange-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
const cardCls =
  "rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900";

const BLANK_FIELD: FormField = {
  key: "",
  label: "",
  type: "text",
  required: false,
  options: [],
};

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function FieldRows({
  fields,
  onChange,
}: {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}) {
  function update(i: number, patch: Partial<FormField>) {
    onChange(fields.map((f, k) => (k === i ? { ...f, ...patch } : f)));
  }
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_110px_70px_1fr_28px] gap-2 text-[11px] font-semibold text-stone-500">
        <span>Key</span><span>Label</span><span>Type</span><span>Req.</span><span>Options (select)</span><span />
      </div>
      {fields.map((f, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_110px_70px_1fr_28px] items-center gap-2">
          <input value={f.key} placeholder="full_name" aria-label={`Field ${i + 1} key`} onChange={(e) => update(i, { key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} className={inputCls} />
          <input value={f.label} placeholder="Full name" aria-label={`Field ${i + 1} label`} onChange={(e) => update(i, { label: e.target.value })} className={inputCls} />
          <select value={f.type} aria-label={`Field ${i + 1} type`} onChange={(e) => update(i, { type: e.target.value as FormField["type"] })} className={inputCls}>
            <option value="text">Text</option>
            <option value="email">Email</option>
            <option value="tel">Phone</option>
            <option value="textarea">Textarea</option>
            <option value="select">Select</option>
          </select>
          <input type="checkbox" checked={f.required} aria-label={`Field ${i + 1} required`} onChange={(e) => update(i, { required: e.target.checked })} className="h-4 w-4 justify-self-center accent-orange-600" />
          <input
            value={f.options.join(", ")}
            disabled={f.type !== "select"}
            placeholder="Option A, Option B"
            aria-label={`Field ${i + 1} options`}
            onChange={(e) => update(i, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })}
            className={`${inputCls} disabled:opacity-40`}
          />
          <button
            onClick={() => onChange(fields.filter((_, k) => k !== i))}
            aria-label={`Remove field ${i + 1}`}
            className="cursor-pointer rounded p-1 text-stone-400 hover:text-red-600"
          >
            <Trash2 size={13} aria-hidden />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...fields, { ...BLANK_FIELD }])}
        className="cursor-pointer rounded-full border border-dashed border-stone-300 px-3.5 py-1.5 text-xs font-semibold text-stone-500 hover:border-orange-400 hover:text-orange-700 dark:border-stone-700"
      >
        <Plus size={11} className="mr-1 inline" aria-hidden /> Add field
      </button>
    </div>
  );
}

export default function FormsManager({ forms }: { forms: FormRow[] }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [newFields, setNewFields] = useState<FormField[]>([
    { key: "name", label: "Name", type: "text", required: true, options: [] },
    { key: "email", label: "Email", type: "email", required: true, options: [] },
    { key: "message", label: "Message", type: "textarea", required: true, options: [] },
  ]);
  const [editFields, setEditFields] = useState<Record<string, FormField[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function api(path: string, init: RequestInit): Promise<boolean> {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(path, {
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

  async function create() {
    const ok = await api("/api/forms", {
      method: "POST",
      body: JSON.stringify({
        name,
        slug,
        fields: newFields,
        notifyEmail: notifyEmail || null,
      }),
    });
    if (ok) {
      setShowCreate(false);
      setName("");
      setSlug("");
      setNotifyEmail("");
    }
  }

  async function toggleSubmissions(form: FormRow) {
    if (expanded === form.id) {
      setExpanded(null);
      return;
    }
    setExpanded(form.id);
    if (!submissions[form.id]) {
      const res = await fetch(`/api/forms/${form.id}/submissions`);
      const json = await res.json().catch(() => ({}));
      if (json.ok) {
        setSubmissions((s) => ({ ...s, [form.id]: json.submissions }));
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex cursor-pointer items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-500"
        >
          <Plus size={15} aria-hidden />
          {showCreate ? "Close" : "New form"}
        </button>
        {error && (
          <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
        )}
      </div>

      {showCreate && (
        <div className={`${cardCls} space-y-4`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="nf-name" className="mb-1 block text-xs font-semibold">Name</label>
              <input id="nf-name" value={name} onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)); }} className={inputCls} placeholder="Lead form" />
            </div>
            <div>
              <label htmlFor="nf-slug" className="mb-1 block text-xs font-semibold">Slug (used in Form sections)</label>
              <input id="nf-slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} className={inputCls} placeholder="lead-form" />
            </div>
            <div>
              <label htmlFor="nf-email" className="mb-1 block text-xs font-semibold">Notify email (optional)</label>
              <input id="nf-email" type="email" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} className={inputCls} placeholder="sales@digisutra.com" />
            </div>
          </div>
          <FieldRows fields={newFields} onChange={setNewFields} />
          <button
            onClick={() => void create()}
            disabled={busy || !name || !slug || newFields.length === 0}
            className="cursor-pointer rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-50 dark:bg-orange-600"
          >
            Create form
          </button>
        </div>
      )}

      {forms.map((form) => {
        const fields = editFields[form.id] ?? form.fields;
        return (
          <div key={form.id} className={cardCls}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-sm font-bold">
                  {form.name}
                  <span className="ml-2 font-sans text-xs font-normal text-stone-500 dark:text-stone-400">
                    slug: {form.slug}
                  </span>
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {form.submissionCount} submission{form.submissionCount === 1 ? "" : "s"}
                  {form.notifyEmail ? ` · notifies ${form.notifyEmail}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() =>
                    void api(`/api/forms/${form.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ isActive: !form.isActive }),
                    })
                  }
                  disabled={busy}
                  className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                    form.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                      : "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400"
                  }`}
                >
                  {form.isActive ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => void toggleSubmissions(form)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-stone-300 px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:border-orange-500 hover:text-orange-700 dark:border-stone-700 dark:text-stone-300"
                >
                  <Inbox size={12} aria-hidden />
                  {expanded === form.id ? "Hide" : "Submissions"}
                </button>
                <a
                  href={`/api/forms/${form.id}/submissions?format=csv`}
                  className="flex items-center gap-1.5 rounded-full border border-stone-300 px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:border-orange-500 hover:text-orange-700 dark:border-stone-700 dark:text-stone-300"
                >
                  <Download size={12} aria-hidden /> CSV
                </a>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${form.name}" and its submissions?`)) {
                      void api(`/api/forms/${form.id}`, { method: "DELETE" });
                    }
                  }}
                  disabled={busy}
                  aria-label={`Delete ${form.name}`}
                  className="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:text-red-600"
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
            </div>

            <div className="mt-4 border-t border-stone-100 pt-4 dark:border-stone-800">
              <FieldRows
                fields={fields}
                onChange={(next) => setEditFields((s) => ({ ...s, [form.id]: next }))}
              />
              {editFields[form.id] && (
                <button
                  onClick={() =>
                    void api(`/api/forms/${form.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ fields: editFields[form.id] }),
                    }).then((ok) => {
                      if (ok) setEditFields((s) => { const n = { ...s }; delete n[form.id]; return n; });
                    })
                  }
                  disabled={busy}
                  className="mt-3 cursor-pointer rounded-full bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-500 disabled:opacity-60"
                >
                  Save fields
                </button>
              )}
            </div>

            {expanded === form.id && (
              <div className="mt-4 overflow-x-auto border-t border-stone-100 pt-4 dark:border-stone-800">
                {!submissions[form.id] ? (
                  <p className="text-sm text-stone-500">Loading…</p>
                ) : submissions[form.id].length === 0 ? (
                  <p className="text-sm text-stone-500">No submissions yet.</p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 uppercase tracking-wide text-stone-500 dark:border-stone-800">
                        <th className="py-2 pr-4 font-semibold">When</th>
                        {form.fields.map((f) => (
                          <th key={f.key} className="py-2 pr-4 font-semibold">{f.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {submissions[form.id].map((s) => (
                        <tr key={s.id} className="border-b border-stone-100 last:border-0 dark:border-stone-800">
                          <td className="whitespace-nowrap py-2 pr-4 text-stone-500">
                            {new Date(s.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                          {form.fields.map((f) => (
                            <td key={f.key} className="max-w-48 truncate py-2 pr-4" title={s.data[f.key]}>
                              {s.data[f.key] || "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
