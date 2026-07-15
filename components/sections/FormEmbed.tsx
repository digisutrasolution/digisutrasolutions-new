"use client";

import { useEffect, useState } from "react";
import type { FormField } from "@/lib/cms/forms";

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200";

export default function FormEmbed({ slug }: { slug: string }) {
  const [fields, setFields] = useState<FormField[] | null>(null);
  const [missing, setMissing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/form-submissions?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setFields(json.form.fields);
        else setMissing(true);
      })
      .catch(() => setMissing(true));
  }, [slug]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    for (const [key, value] of fd.entries()) {
      if (typeof value === "string") data[key] = value;
    }
    try {
      const res = await fetch("/api/form-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, data, website: data.website }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not submit. Try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error — check your connection.");
    } finally {
      setBusy(false);
    }
  }

  if (!slug || missing) return null;
  if (!fields) {
    return (
      <div className="h-40 animate-pulse rounded-3xl border border-stone-200 bg-stone-50" />
    );
  }
  if (submitted) {
    return (
      <div className="rounded-3xl border border-green-200 bg-green-50 p-8 text-center">
        <p className="font-display text-lg font-bold text-green-900">
          Thanks — we got it.
        </p>
        <p className="mt-1 text-sm text-green-800/80">
          We&apos;ll get back to you within one business day.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-3xl border border-stone-200 bg-white p-7"
    >
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const id = `f-${slug}-${field.key}`;
          const label = (
            <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-stone-700">
              {field.label}
              {field.required && " *"}
            </label>
          );
          if (field.type === "textarea") {
            return (
              <div key={field.key} className="sm:col-span-2">
                {label}
                <textarea id={id} name={field.key} rows={4} required={field.required} className={inputCls} />
              </div>
            );
          }
          if (field.type === "select") {
            return (
              <div key={field.key}>
                {label}
                <select id={id} name={field.key} required={field.required} className={inputCls}>
                  <option value="">Choose…</option>
                  {field.options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            );
          }
          return (
            <div key={field.key}>
              {label}
              <input
                id={id}
                name={field.key}
                type={field.type}
                required={field.required}
                autoComplete={field.type === "email" ? "email" : field.type === "tel" ? "tel" : undefined}
                className={inputCls}
              />
            </div>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="animate-shimmer mt-5 w-full cursor-pointer rounded-full bg-[linear-gradient(120deg,#EA580C,#FB923C,#EA580C)] py-3.5 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {busy ? "Sending…" : "Submit ↗"}
      </button>
    </form>
  );
}
