"use client";

import { withBase } from "@/lib/base-path";
import { readAttribution } from "@/lib/attribution";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import type { FormField } from "@/lib/cms/forms";
import OtpVerify, { type Challenge } from "@/components/OtpVerify";
import ServicePicker from "@/components/contact/ServicePicker";
import { makeSpamToken } from "@/lib/spam";

/* One field style for the whole form.
   h-11 (44px) is the WCAG 2.5.5 touch-target floor AND matches ServicePicker's
   min-h-11, so the combobox lines up with the plain inputs instead of sitting
   a few pixels short of them.
   The focus ring is a wide, low-opacity brand halo rather than a hard outline:
   visible enough to satisfy 2.4.7, quiet enough not to look like an error. */
const fieldBase =
  "w-full rounded-xl border border-stone-300 bg-white text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#F26419] focus:ring-4 focus:ring-[#F26419]/12";
const inputCls = `${fieldBase} h-11 px-4`;
const areaCls = `${fieldBase} px-4 py-3 leading-relaxed`;

/* Labels: one style, every field. The picker used to bring its own uppercase
   grey label, so "SERVICE" shouted next to a quiet "Name" — the host form owns
   the label now and the control just renders the control. */
const labelCls = "mb-1.5 block text-[13px] font-semibold text-stone-800";

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className={labelCls}>
      {children}
      {/* Coloured, and carrying a text alternative — an asterisk alone is
          colour-and-glyph only, which a screen reader reads as "star". */}
      {required && (
        <span className="text-[#F26419]" aria-hidden>
          {" *"}
        </span>
      )}
      {required && <span className="sr-only"> (required)</span>}
    </label>
  );
}

export default function FormEmbed({ slug }: { slug: string }) {
  const [fields, setFields] = useState<FormField[] | null>(null);
  const [missing, setMissing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [sentContact, setSentContact] = useState({ email: "", phone: "" });
  /* Multiselect values by field key. Held here rather than in the DOM because
     ServicePicker is a combobox, not a native control; a hidden input mirrors
     each one so FormData still sees it. */
  const [multi, setMulti] = useState<Record<string, string[]>>({});
  const startedAt = useRef<number>(0);
  const jsToken = useRef<string>("");

  // Arm the time-trap and mint the proof-of-JS token once mounted.
  useEffect(() => {
    startedAt.current = Date.now();
    jsToken.current = makeSpamToken();
  }, []);

  useEffect(() => {
    if (!slug) return;
    fetch(withBase(`/api/form-submissions?slug=${encodeURIComponent(slug)}`))
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
      const res = await fetch(withBase("/api/form-submissions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          data,
          website: data.website,
          startedAt: startedAt.current,
          attribution: readAttribution(),
          jsToken: jsToken.current,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not submit. Try again.");
        return;
      }
      /* Soft verification — the submission is already stored, so this step is
         optional and skippable. Only lead-destination forms return one. */
      if (json.verify) {
        setSentContact({ email: data.email ?? "", phone: data.phone ?? data.whatsapp ?? "" });
        setChallenge(json.verify as Challenge);
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
  if (challenge) {
    return (
      <div className="rounded-3xl border border-stone-200 bg-white p-8">
        <OtpVerify
          challenge={challenge}
          resend={async () => {
            try {
              const res = await fetch(withBase("/api/otp/send"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: sentContact.email,
                  phone: sentContact.phone,
                }),
              });
              const d = await res.json();
              return d.ok && d.challenge ? { id: d.challenge.id } : null;
            } catch {
              return null;
            }
          }}
          onVerified={() => {
            setChallenge(null);
            setSubmitted(true);
          }}
          onSkip={() => {
            setChallenge(null);
            setSubmitted(true);
          }}
        />
      </div>
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
      className="rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_18px_44px_-32px_rgba(28,25,23,0.4)] sm:p-9"
    >
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
        {fields.map((field) => {
          const id = `f-${slug}-${field.key}`;
          const label = (
            <FieldLabel htmlFor={id} required={field.required}>
              {field.label}
            </FieldLabel>
          );
          if (field.type === "textarea") {
            return (
              <div key={field.key} className="sm:col-span-2">
                {label}
                <textarea id={id} name={field.key} rows={4} required={field.required} className={areaCls} />
              </div>
            );
          }
          /* Searchable pick-many, reusing the contact form's combobox rather
             than a second one. It is not a native control, so a hidden input
             carries the joined value and the existing FormData collection
             above keeps working untouched. */
          if (field.type === "multiselect") {
            const picked = multi[field.key] ?? [];
            return (
              <div key={field.key} className="sm:col-span-2">
                {/* The form owns the label so this field reads like the rest of
                    them; the picker renders only the control. */}
                {label}
                <ServicePicker
                  hideLabel
                  inputId={id}
                  placeholder="Search or pick from the list…"
                  options={field.options.map((name) => ({ name }))}
                  value={picked}
                  onChange={(next) => setMulti((m) => ({ ...m, [field.key]: next }))}
                />
                <input type="hidden" name={field.key} value={picked.join(", ")} />
              </div>
            );
          }
          if (field.type === "select") {
            return (
              <div key={field.key}>
                {label}
                <select id={id} name={field.key} required={field.required} className={`${inputCls} cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2378716C%22 stroke-width=%222%22 stroke-linecap=%22round%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_0.9rem_center] bg-no-repeat pr-10`}>
                  <option value="">Choose…</option>
                  {field.options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            );
          }
          if (field.type === "checkbox") {
            return (
              <div key={field.key} className="sm:col-span-2">
                {/* A whole tappable row, not a 16px box: the label is part of
                    the hit area, which is what gets this over the 44px
                    target on a phone. */}
                <label
                  htmlFor={id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 p-3 text-sm text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-50 has-[:focus-visible]:border-[#F26419] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#F26419]/12"
                >
                  <input
                    id={id}
                    name={field.key}
                    type="checkbox"
                    value="Yes"
                    required={field.required}
                    className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[#F26419]"
                  />
                  <span>
                    {field.label}
                    {field.required && (
                      <span className="text-[#F26419]" aria-hidden>
                        {" *"}
                      </span>
                    )}
                  </span>
                </label>
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
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-800"
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 border-t border-stone-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={busy}
          className="animate-shimmer inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[linear-gradient(120deg,#EA580C,#FB923C,#EA580C)] text-sm font-bold text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:px-10"
        >
          {busy && <Loader2 size={15} className="animate-spin" aria-hidden />}
          {busy ? "Sending…" : "Submit ↗"}
        </button>
        {/* Answers the two questions people actually hesitate on, at the exact
            moment they hesitate — beside the button, not buried in a policy. */}
        <p className="text-xs leading-relaxed text-stone-400 sm:text-right">
          Replies within one business day.
          <br className="hidden sm:block" /> No spam, and your details stay with us.
        </p>
      </div>
    </form>
  );
}
