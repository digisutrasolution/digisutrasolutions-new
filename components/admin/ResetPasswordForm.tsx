"use client";

import { useState } from "react";
import Link from "next/link";
import { withBase } from "@/lib/base-path";
import { Check, Eye, EyeOff, RefreshCw } from "lucide-react";

const ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*?";

function generatePassword(length = 16): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i += 1) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

function strength(pw: string): { pct: number; label: string; color: string } {
  const classes =
    Number(/[a-z]/.test(pw)) +
    Number(/[A-Z]/.test(pw)) +
    Number(/\d/.test(pw)) +
    Number(/[^A-Za-z0-9]/.test(pw));
  if (pw.length < 10) return { pct: 25, label: "Too short", color: "#DC2626" };
  if (pw.length >= 14 && classes >= 3) return { pct: 100, label: "Strong", color: "#1D9E75" };
  if (pw.length >= 12 && classes >= 2) return { pct: 70, label: "Good", color: "#CA8A04" };
  return { pct: 45, label: "Weak", color: "#EA580C" };
}

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const s = strength(password);
  const tooShort = touched && password.length > 0 && password.length < 10;
  const mismatch = touched && confirm.length > 0 && confirm !== password;
  const canSubmit = password.length >= 10 && confirm === password && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(withBase("/api/auth/reset"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not reset the password.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mt-5">
        <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm leading-relaxed text-emerald-800">
          <Check size={16} className="mt-0.5 shrink-0" aria-hidden />
          Password updated. Any other devices signed in with the old password
          have been signed out.
        </p>
        <Link
          href="/admin/login"
          className="mt-4 flex w-full items-center justify-center rounded-full bg-[#F26419] py-2.5 text-sm font-bold text-white no-underline transition-colors hover:bg-orange-600"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const field =
    "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:ring-2";
  const ok = "border-stone-300 focus:border-orange-500 focus:ring-orange-200";
  const bad = "border-red-400 focus:border-red-500 focus:ring-red-100";

  return (
    <form onSubmit={submit} className="mt-5" noValidate>
      <label htmlFor="rp-new" className="mb-1 block text-xs font-semibold text-stone-500">
        New password
      </label>
      <div className="flex items-center gap-1.5">
        <input
          id="rp-new"
          type={show ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched(true)}
          autoComplete="new-password"
          autoFocus
          aria-invalid={tooShort || undefined}
          aria-describedby={tooShort ? "rp-new-err" : undefined}
          className={`${field} ${tooShort ? bad : ok} font-mono`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          className="cursor-pointer rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <button
          type="button"
          onClick={() => {
            const p = generatePassword();
            setPassword(p);
            setConfirm(p);
            setShow(true);
          }}
          aria-label="Generate a strong password"
          className="shrink-0 cursor-pointer rounded-full border border-orange-300 bg-orange-50 px-2.5 py-2 text-[11px] font-bold text-orange-700 transition-colors hover:bg-orange-100"
        >
          <RefreshCw size={12} className="mr-1 inline" aria-hidden />
          Generate
        </button>
      </div>

      <div className="mt-2 h-1 overflow-hidden rounded-full bg-stone-200">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: password ? `${s.pct}%` : "0%", background: s.color }}
        />
      </div>
      {tooShort ? (
        <p id="rp-new-err" role="alert" className="mt-1 text-xs text-red-600">
          Password must be at least 10 characters.
        </p>
      ) : (
        <p className="mt-1 text-[11px] text-stone-500">
          {password ? `${s.label} · ${password.length} characters` : "Minimum 10 characters"}
        </p>
      )}

      <label htmlFor="rp-confirm" className="mb-1 mt-4 block text-xs font-semibold text-stone-500">
        Confirm password
      </label>
      <input
        id="rp-confirm"
        type={show ? "text" : "password"}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        onBlur={() => setTouched(true)}
        autoComplete="new-password"
        aria-invalid={mismatch || undefined}
        aria-describedby={mismatch ? "rp-confirm-err" : undefined}
        className={`${field} ${mismatch ? bad : ok} font-mono`}
      />
      {mismatch && (
        <p id="rp-confirm-err" role="alert" className="mt-1 text-xs text-red-600">
          Passwords do not match.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">
          {error}{" "}
          <Link href="/admin/login" className="font-semibold underline">
            Request a new link
          </Link>
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-4 w-full cursor-pointer rounded-full bg-[#F26419] py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
      >
        {busy ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}
