"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { withBase } from "@/lib/base-path";
import { Check, Mail, MessageSquare, ShieldCheck } from "lucide-react";

export type Challenge = {
  id: string;
  channel: "email" | "sms";
  target: string; // masked
  length: number;
  resendSeconds: number;
  ttlMinutes: number;
};

/* Productionised verification step (matches the approved prototype): 6-box
   code entry with auto-advance, backspace, paste-to-fill, error shake and an
   animated success tick. Soft by design — a "Skip for now" always lets the
   lead through, because the enquiry is already captured. */
export default function OtpVerify({
  challenge,
  resend,
  onVerified,
  onSkip,
}: {
  challenge: Challenge;
  /** Ask the server for a fresh code; returns the new challenge id. */
  resend: () => Promise<{ id: string } | null>;
  onVerified: () => void;
  onSkip: () => void;
}) {
  const len = Math.min(8, Math.max(4, challenge.length || 6));
  const [id, setId] = useState(challenge.id);
  const [digits, setDigits] = useState<string[]>(() => Array(len).fill(""));
  const [state, setState] = useState<"idle" | "checking" | "error" | "done">("idle");
  const [msg, setMsg] = useState("");
  const [left, setLeft] = useState(challenge.resendSeconds);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const busy = useRef(false);

  const ChannelIcon = challenge.channel === "sms" ? MessageSquare : Mail;
  const code = useMemo(() => digits.join(""), [digits]);

  useEffect(() => {
    const t = setTimeout(() => refs.current[0]?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (left <= 0) return;
    const iv = setInterval(() => setLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(iv);
  }, [left]);

  function setAt(i: number, v: string) {
    setDigits((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }

  async function submit(value: string, challengeId: string) {
    if (busy.current || value.length !== len) return;
    busy.current = true;
    setState("checking");
    setMsg("");
    try {
      const res = await fetch(withBase("/api/otp/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: challengeId, code: value }),
      });
      const data = await res.json();
      if (data.ok) {
        setState("done");
        setTimeout(onVerified, 1400);
      } else {
        setState("error");
        setMsg(data.error ?? "That code didn't work.");
        setTimeout(() => {
          setDigits(Array(len).fill(""));
          setState("idle");
          refs.current[0]?.focus();
          busy.current = false;
        }, 700);
      }
    } catch {
      setState("error");
      setMsg("Network error — try again.");
      busy.current = false;
    }
  }

  function onInput(i: number, raw: string) {
    if (state === "error") setState("idle");
    const v = raw.replace(/\D/g, "").slice(-1);
    setAt(i, v);
    if (v && i < len - 1) refs.current[i + 1]?.focus();
  }

  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
      setAt(i - 1, "");
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < len - 1) refs.current[i + 1]?.focus();
  }

  function onPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const d = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, len).split("");
    if (!d.length) return;
    const next = Array(len).fill("");
    d.forEach((c, k) => (next[k] = c));
    setDigits(next);
    refs.current[Math.min(d.length, len - 1)]?.focus();
    if (d.length === len) void submit(next.join(""), id);
  }

  // Auto-submit once the last box is filled by typing.
  useEffect(() => {
    if (code.length === len && state === "idle" && !busy.current) void submit(code, id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function doResend() {
    if (left > 0) return;
    setMsg("");
    const fresh = await resend();
    if (fresh) {
      setId(fresh.id);
      setDigits(Array(len).fill(""));
      setState("idle");
      busy.current = false;
      setLeft(challenge.resendSeconds);
      refs.current[0]?.focus();
      setMsg("A fresh code is on its way.");
    } else {
      setMsg("Couldn't resend just now — try again shortly.");
    }
  }

  if (state === "done") {
    return (
      <div className="flex h-full flex-col items-center justify-center py-16 text-center">
        <span className="otp-pop flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check size={30} aria-hidden />
        </span>
        <h2 className="font-display mt-4 text-2xl font-extrabold text-stone-900">You&rsquo;re verified</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-600">
          Thanks — your {challenge.channel === "sms" ? "number" : "email"} is confirmed. Taking you through…
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#F26419]">
        <ChannelIcon size={26} aria-hidden />
      </span>
      <h2 className="font-display mt-4 text-2xl font-extrabold tracking-tight text-stone-900">
        Verify your {challenge.channel === "sms" ? "number" : "email"}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-600">
        We sent a {len}-digit code to <b className="text-stone-900">{challenge.target}</b>. Enter it below.
      </p>

      <div className={`mt-6 flex justify-center gap-2 ${state === "error" ? "otp-shake" : ""}`}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            onChange={(e) => onInput(i, e.target.value)}
            onKeyDown={(e) => onKey(i, e)}
            onPaste={onPaste}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            aria-label={`Digit ${i + 1}`}
            disabled={state === "checking"}
            className={`h-14 w-12 rounded-xl border-2 bg-stone-50 text-center text-2xl font-extrabold text-stone-900 outline-none transition-all focus:-translate-y-0.5 focus:border-[#F26419] focus:bg-white focus:shadow-[0_0_0_4px_rgba(242,100,25,0.12)] ${
              state === "error" ? "border-red-400 bg-red-50" : d ? "border-[#F26419] bg-white" : "border-stone-200"
            }`}
          />
        ))}
      </div>

      <div className="mt-4 h-5 text-xs">
        {state === "checking" ? (
          <span className="text-stone-500">Verifying…</span>
        ) : msg ? (
          <span className={state === "error" ? "text-red-600" : "text-emerald-700"}>{msg}</span>
        ) : (
          <span className="text-stone-400">Tip: paste the whole code — it fills every box.</span>
        )}
      </div>

      <div className="mt-5 flex items-center gap-2 text-xs text-stone-500">
        {left > 0 ? (
          <span>Resend code in 0:{String(left).padStart(2, "0")}</span>
        ) : (
          <button onClick={doResend} className="cursor-pointer font-semibold text-[#F26419] underline">
            Resend code
          </button>
        )}
      </div>

      <button
        onClick={onSkip}
        className="mt-6 cursor-pointer text-xs font-medium text-stone-400 underline underline-offset-2 hover:text-stone-600"
      >
        Skip for now
      </button>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
        <ShieldCheck size={12} aria-hidden /> Verified enquiries get a faster reply
      </p>
    </div>
  );
}
