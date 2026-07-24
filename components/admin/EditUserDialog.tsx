"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/** Edit a user's name and email. Role and status stay inline in the table
    row, where they are one click rather than a dialog. */
export default function EditUserDialog({
  user,
  busy,
  onClose,
  onSubmit,
}: {
  user: { id: string; name: string; email: string };
  busy: boolean;
  onClose: () => void;
  onSubmit: (v: { name: string; email: string }) => void;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const field =
    "w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

  const changed =
    name.trim() !== user.name || email.trim().toLowerCase() !== user.email;
  const valid = name.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(email.trim());

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${user.email}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_20px_50px_rgba(28,25,23,0.25)] dark:bg-stone-900">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-base font-bold text-stone-900 dark:text-stone-100">
            Edit user
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4">
          <label
            htmlFor="edit-name"
            className="mb-1 block text-xs font-semibold text-stone-500 dark:text-stone-400"
          >
            Name
          </label>
          <input
            id="edit-name"
            ref={first}
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            className={field}
          />
        </div>

        <div className="mt-4">
          <label
            htmlFor="edit-email"
            className="mb-1 block text-xs font-semibold text-stone-500 dark:text-stone-400"
          >
            Email
          </label>
          <input
            id="edit-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
            className={field}
          />
          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
            This is also the login username.
          </p>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit({ name: name.trim(), email: email.trim() })}
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
