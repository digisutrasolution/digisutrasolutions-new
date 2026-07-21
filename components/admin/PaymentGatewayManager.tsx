"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import { AlertTriangle, Save } from "lucide-react";

type GatewayView = { enabled: boolean; mode: "test" | "live"; keyId: string; hasSecret: boolean };
type SimpleView = { enabled: boolean; note: string };

export type PaymentsView = {
  cashfree: GatewayView;
  paypal: GatewayView;
  upi: SimpleView;
  bank: SimpleView;
  wire: SimpleView;
};

const fieldCls =
  "rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
const labelCls = "mb-1 block text-xs font-semibold text-stone-500 dark:text-stone-400";

const GATEWAYS = [
  { key: "cashfree" as const, name: "Cashfree", idLabel: "App ID", secretLabel: "Secret key" },
  { key: "paypal" as const, name: "PayPal", idLabel: "Client ID", secretLabel: "Client secret" },
];

const SIMPLE = [
  { key: "upi" as const, name: "UPI / QR", hint: "Shown on the payment page" },
  { key: "bank" as const, name: "Indian bank transfer", hint: "NEFT / IMPS / RTGS" },
  { key: "wire" as const, name: "International wire", hint: "SWIFT — USD, AED, GBP, EUR" },
];

export default function PaymentGatewayManager({ initial }: { initial: PaymentsView }) {
  const [p, setP] = useState<PaymentsView>(initial);
  const [secrets, setSecrets] = useState<Record<string, string>>({ cashfree: "", paypal: "" });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const setGateway = (key: "cashfree" | "paypal", patch: Partial<GatewayView>) =>
    setP((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  const setSimple = (key: "upi" | "bank" | "wire", patch: Partial<SimpleView>) =>
    setP((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  async function save() {
    setState("saving");
    setError(null);
    try {
      const res = await fetch(withBase("/api/settings/payments"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payments: {
            cashfree: { ...p.cashfree, keySecret: secrets.cashfree },
            paypal: { ...p.paypal, keySecret: secrets.paypal },
            upi: p.upi,
            bank: p.bank,
            wire: p.wire,
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Save failed.");
        setState("error");
        return;
      }
      setP(json.payments);
      setSecrets({ cashfree: "", paypal: "" });
      setState("saved");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setError("Network error.");
      setState("error");
    }
  }

  return (
    <div className="space-y-4">
      {GATEWAYS.map((g) => {
        const gw = p[g.key];
        const incomplete = gw.enabled && (!gw.keyId || (!gw.hasSecret && !secrets[g.key]));
        return (
          <div
            key={g.key}
            className="rounded-xl border border-stone-200 p-4 dark:border-stone-800"
          >
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-100">
                <input
                  type="checkbox"
                  checked={gw.enabled}
                  onChange={(e) => setGateway(g.key, { enabled: e.target.checked })}
                />
                {g.name}
              </label>
              <div className="inline-flex overflow-hidden rounded-full border border-stone-300 dark:border-stone-700">
                {(["test", "live"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setGateway(g.key, { mode: m })}
                    aria-pressed={gw.mode === m}
                    className={`cursor-pointer px-3 py-1 text-xs font-bold uppercase transition-colors ${
                      gw.mode === m
                        ? m === "live"
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-500 text-white"
                        : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {incomplete && (
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <AlertTriangle size={12} aria-hidden /> Keys missing
                </span>
              )}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>{g.idLabel}</label>
                <input
                  value={gw.keyId}
                  onChange={(e) => setGateway(g.key, { keyId: e.target.value })}
                  placeholder={gw.mode === "test" ? "Test credentials" : "Live credentials"}
                  className={`${fieldCls} w-full font-mono text-xs`}
                />
              </div>
              <div>
                <label className={labelCls}>
                  {g.secretLabel}{" "}
                  {gw.hasSecret && (
                    <span className="font-normal text-emerald-600">· saved, leave blank to keep</span>
                  )}
                </label>
                <input
                  type="password"
                  value={secrets[g.key]}
                  onChange={(e) => setSecrets((s) => ({ ...s, [g.key]: e.target.value }))}
                  placeholder={gw.hasSecret ? "••••••••" : "Paste the secret"}
                  autoComplete="new-password"
                  className={`${fieldCls} w-full font-mono text-xs`}
                />
              </div>
            </div>
          </div>
        );
      })}

      <div className="rounded-xl border border-stone-200 p-4 dark:border-stone-800">
        <p className="text-sm font-bold text-stone-900 dark:text-stone-100">Manual methods</p>
        <div className="mt-3 space-y-3">
          {SIMPLE.map((s) => (
            <div key={s.key} className="grid grid-cols-[minmax(150px,190px)_minmax(0,1fr)] items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700 dark:text-stone-200">
                <input
                  type="checkbox"
                  checked={p[s.key].enabled}
                  onChange={(e) => setSimple(s.key, { enabled: e.target.checked })}
                />
                {s.name}
              </label>
              <input
                value={p[s.key].note}
                onChange={(e) => setSimple(s.key, { note: e.target.value })}
                placeholder={s.hint}
                maxLength={160}
                className={`${fieldCls} w-full`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={state === "saving"}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50"
        >
          <Save size={13} aria-hidden /> {state === "saving" ? "Saving…" : "Save payment settings"}
        </button>
        {state === "saved" && (
          <span className="text-xs font-semibold text-emerald-600">Saved — live immediately.</span>
        )}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
      <p className="text-xs leading-relaxed text-stone-400">
        Turning a method off hides it on the payment page. Secrets are stored server-side and never
        sent back to this screen. Checkout buttons aren&rsquo;t wired yet — these keys are ready for
        when they are.
      </p>
    </div>
  );
}
