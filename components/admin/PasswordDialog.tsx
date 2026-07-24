"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Eye, EyeOff, RefreshCw, X } from "lucide-react";

/**
 * Password dialog, in two modes driven by `isSelf`:
 *
 *  - admin resetting someone else  → no current password (an admin cannot
 *    know it; their authority is the users.manage permission)
 *  - changing your own password    → current password required, so a walk-up
 *    to an unlocked session cannot take the account over
 *
 * Replaces the old window.prompt(), which showed the password in clear text,
 * offered no generator, and could not enforce the current-password rule.
 */

const ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*?";

/** Crypto-random so generated passwords aren't predictable from Math.random. */
function generatePassword(length = 16): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i += 1) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** Rough strength purely for feedback — the server enforces the real rule. */
function strength(pw: string): { score: 0 | 1 | 2 | 3; label: string; color: string } {
  const classes =
    Number(/[a-z]/.test(pw)) +
    Number(/[A-Z]/.test(pw)) +
    Number(/\d/.test(pw)) +
    Number(/[^A-Za-z0-9]/.test(pw));
  if (pw.length < 10) return { score: 0, label: "Too short", color: "#DC2626" };
  if (pw.length >= 14 && classes >= 3) return { score: 3, label: "Strong", color: "#1D9E75" };
  if (pw.length >= 12 && classes >= 2) return { score: 2, label: "Good", color: "#CA8A04" };
  return { score: 1, label: "Weak", color: "#EA580C" };
}

export default function PasswordDialog({
  user,
  isSelf,
  busy,
  onClose,
  onSubmit,
}: {
  user: { id: string; name: string; email: string };
  isSelf: boolean;
  busy: boolean;
  onClose: () => void;
  onSubmit: (v: { password: string; currentPassword?: string }) => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstField.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const s = strength(next);
  const canSubmit =
    next.length >= 10 && (!isSelf || current.length > 0) && !busy;

  function copy() {
    void navigator.clipboard.writeText(next).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const field =
    "w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
  const iconBtn =
    "cursor-pointer rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isSelf ? "Change your password" : `Reset password for ${user.email}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_20px_50px_rgba(28,25,23,0.25)] dark:bg-stone-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold text-stone-900 dark:text-stone-100">
              {isSelf ? "Change your password" : "Reset password"}
            </h2>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              {isSelf ? "You will be signed out on all devices" : `for ${user.email}`}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className={iconBtn}>
            <X size={16} />
          </button>
        </div>

        {isSelf && (
          <div className="mt-4">
            <label
              htmlFor="pw-current"
              className="mb-1 block text-xs font-semibold text-stone-500 dark:text-stone-400"
            >
              Current password
            </label>
            <input
              id="pw-current"
              ref={firstField}
              type={show ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              className={field}
            />
          </div>
        )}

        <div className="mt-4">
          <label
            htmlFor="pw-new"
            className="mb-1 block text-xs font-semibold text-stone-500 dark:text-stone-400"
          >
            New password
          </label>
          <div className="flex items-center gap-1.5">
            <input
              id="pw-new"
              ref={isSelf ? undefined : firstField}
              type={show ? "text" : "password"}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              minLength={10}
              autoComplete="new-password"
              className={`${field} font-mono`}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              title={show ? "Hide" : "Show"}
              className={iconBtn}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              type="button"
              onClick={copy}
              disabled={!next}
              aria-label="Copy password"
              title="Copy"
              className={iconBtn}
            >
              {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            </button>
            <button
              type="button"
              onClick={() => {
                setNext(generatePassword());
                setShow(true);
              }}
              aria-label="Generate a strong password"
              title="Generate"
              className="shrink-0 cursor-pointer rounded-full border border-orange-300 bg-orange-50 px-2.5 py-1.5 text-[11px] font-bold text-orange-700 transition-colors hover:bg-orange-100 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300"
            >
              <RefreshCw size={12} className="mr-1 inline" aria-hidden />
              Generate
            </button>
          </div>

          <div className="mt-2 h-1 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: next ? `${((s.score + 1) / 4) * 100}%` : "0%",
                background: s.color,
              }}
            />
          </div>
          <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
            {next ? `${s.label} · ${next.length} characters` : "Minimum 10 characters"}
          </p>
        </div>

        {!isSelf && (
          <p className="mt-4 rounded-xl bg-stone-50 px-3 py-2 text-[11px] leading-relaxed text-stone-500 dark:bg-stone-800 dark:text-stone-400">
            Copy the password before saving — it is hashed on the server and
            cannot be shown again. Saving signs this user out everywhere.
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSubmit({
                password: next,
                ...(isSelf ? { currentPassword: current } : {}),
              })
            }
            disabled={!canSubmit}
            className="cursor-pointer rounded-full bg-[#F26419] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
          >
            {busy ? "Saving…" : isSelf ? "Update password" : "Set password"}
          </button>
        </div>
      </div>
    </div>
  );
}
