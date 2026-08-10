"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { UserRound, X } from "lucide-react";
import UploadButton from "@/components/admin/UploadButton";
import { withBase } from "@/lib/base-path";

/* Edit a team member's profile. Role and status stay inline in the table row,
   where they are one click rather than a dialog.

   Every field except name and email is optional and stays optional — an
   account that has only ever been given a login must keep working, so nothing
   here is allowed to become required later without a migration plan. */

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  photoUrl: string | null;
  mobile: string | null;
  whatsapp: string | null;
  telegram: string | null;
  teamsId: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
};

/** Everything the dialog can send. Strings, never null — the API turns an
    empty string into null so a field can be cleared. */
export type UserProfileInput = Omit<UserProfile, "id"> extends infer T
  ? { [K in keyof T]: string }
  : never;

const TEXT: (keyof UserProfileInput)[] = [
  "name", "email", "photoUrl", "mobile", "whatsapp", "telegram",
  "teamsId", "address", "city", "state", "country", "postalCode",
];

const fieldCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
const labelCls = "mb-1 block text-xs font-semibold text-stone-500 dark:text-stone-400";

/* Module level, not defined inside the dialog: a component created during
   render is a new type every pass, so React remounts it and the input loses
   focus after each keystroke. */
function TextField({
  name,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  inputRef,
  minLength,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  minLength?: number;
}) {
  return (
    <div>
      <label htmlFor={`u-${name}`} className={labelCls}>
        {label}
      </label>
      <input
        id={`u-${name}`}
        ref={inputRef}
        type={type}
        value={value}
        placeholder={placeholder}
        minLength={minLength}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        className={fieldCls}
      />
    </div>
  );
}

export default function EditUserDialog({
  user,
  busy,
  onClose,
  onSubmit,
}: {
  user: UserProfile;
  busy: boolean;
  onClose: () => void;
  onSubmit: (v: UserProfileInput) => void;
}) {
  const [form, setForm] = useState<UserProfileInput>(() => {
    const seed = {} as UserProfileInput;
    for (const k of TEXT) seed[k] = (user as Record<string, unknown>)[k] as string ?? "";
    return seed;
  });
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (k: keyof UserProfileInput, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const changed = TEXT.some(
    (k) => form[k].trim() !== (((user as Record<string, unknown>)[k] as string) ?? ""),
  );
  const valid =
    form.name.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(form.email.trim());

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-stone-900/40 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${user.email}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-[0_20px_50px_rgba(28,25,23,0.25)] dark:bg-stone-900">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-base font-bold text-stone-900 dark:text-stone-100">
            Edit team member
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800"
          >
            <X size={16} />
          </button>
        </div>

        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-stone-400">
          Basic information
        </p>

        <div className="mt-2 flex items-start gap-4">
          {/* The avatar previews the URL live, so a bad path is obvious here
              rather than after saving. */}
          <div className="shrink-0">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-stone-200 bg-stone-100 dark:border-stone-700 dark:bg-stone-800">
              {form.photoUrl ? (
                <Image
                  src={withBase(form.photoUrl)}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-stone-400">
                  <UserRound size={24} aria-hidden />
                </span>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <label htmlFor="u-photoUrl" className={labelCls}>
              Profile photo
            </label>
            <div className="flex items-center gap-2">
              <input
                id="u-photoUrl"
                value={form.photoUrl}
                placeholder="/uploads/… or https://…"
                onChange={(e) => set("photoUrl", e.target.value)}
                className={fieldCls}
              />
              <UploadButton
                accept="image/*"
                endpoint="/api/upload"
                label="Upload"
                onUploaded={(url) => set("photoUrl", url)}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField name="name" label="Full name" value={form.name} onChange={(v) => set("name", v)} inputRef={first} minLength={2} />
          <TextField name="email" label="Email address" value={form.email} onChange={(v) => set("email", v)} type="email" />
          <TextField name="mobile" label="Mobile number" value={form.mobile} onChange={(v) => set("mobile", v)} type="tel" placeholder="+91…" />
          <TextField name="city" label="City" value={form.city} onChange={(v) => set("city", v)}  />
          <div className="sm:col-span-2">
            <TextField name="address" label="Address" value={form.address} onChange={(v) => set("address", v)}  />
          </div>
          <TextField name="state" label="State" value={form.state} onChange={(v) => set("state", v)}  />
          <TextField name="country" label="Country" value={form.country} onChange={(v) => set("country", v)}  />
          <TextField name="postalCode" label="PIN code" value={form.postalCode} onChange={(v) => set("postalCode", v)}  />
        </div>
        <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
          The email address is also the login username.
        </p>

        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-stone-400">
          Communication
        </p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TextField name="whatsapp" label="WhatsApp number" value={form.whatsapp} onChange={(v) => set("whatsapp", v)} type="tel" placeholder="+91…" />
          <TextField name="teamsId" label="Microsoft Teams ID" value={form.teamsId} onChange={(v) => set("teamsId", v)} placeholder="name@company.com" />
          <TextField name="telegram" label="Telegram ID" value={form.telegram} onChange={(v) => set("telegram", v)} placeholder="@handle" />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const out = {} as UserProfileInput;
              for (const k of TEXT) out[k] = form[k].trim();
              onSubmit(out);
            }}
            disabled={!valid || !changed || busy}
            className="cursor-pointer rounded-full bg-[#F26419] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
