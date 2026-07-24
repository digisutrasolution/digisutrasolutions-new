"use client";

import { useState } from "react";
import { withBase } from "@/lib/base-path";
import { ArrowLeft, Check, Mail } from "lucide-react";

/** Client-side check only mirrors the server's — the server always re-validates. */
function looksLikeEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

export default function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const invalid = touched && !looksLikeEmail(email);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!looksLikeEmail(email)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(withBase("/api/auth/forgot"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Something went wrong. Try again.");
        return;
      }
      setDone(json.message as string);
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
          {done}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-stone-500">
          Not arrived? Check the spam folder, then try again in a few minutes.
        </p>
        <button
          onClick={onBack}
          className="mt-4 flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-orange-700 hover:underline"
        >
          <ArrowLeft size={14} aria-hidden /> Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5" noValidate>
      <label
        htmlFor="forgot-email"
        className="mb-1 block text-xs font-semibold text-stone-500"
      >
        Email address
      </label>
      <input
        id="forgot-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => setTouched(true)}
        autoComplete="email"
        autoFocus
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? "forgot-email-err" : undefined}
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:ring-2 ${
          invalid
            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
            : "border-stone-300 focus:border-orange-500 focus:ring-orange-200"
        }`}
      />
      {invalid && (
        <p id="forgot-email-err" role="alert" className="mt-1 text-xs text-red-600">
          Enter a valid email address.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#F26419] py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
      >
        <Mail size={15} aria-hidden />
        {busy ? "Sending…" : "Send reset link"}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="mt-4 flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-stone-800"
      >
        <ArrowLeft size={14} aria-hidden /> Back to sign in
      </button>
    </form>
  );
}
