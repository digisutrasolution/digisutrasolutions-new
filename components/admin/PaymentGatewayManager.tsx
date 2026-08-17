"use client";

import { withBase } from "@/lib/base-path";

import { useState } from "react";
import { AlertTriangle, Eye, EyeOff, Save } from "lucide-react";
import UploadButton from "@/components/admin/UploadButton";
import type { Payments } from "@/lib/payments";

type GatewayView = { enabled: boolean; mode: "test" | "live"; keyId: string; hasSecret: boolean };

/* The manual methods are typed straight off the zod schema instead of being
   restated here, so a field added to lib/payments cannot be silently missing
   from this screen. Type-only import — erased at build, so the server-only
   `db` that lib/payments pulls in never reaches the client bundle. */
export type PaymentsView = {
  cashfree: GatewayView;
  paypal: GatewayView;
  upi: Payments["upi"];
  bank: Payments["bank"];
  wire: Payments["wire"];
};

type ManualKey = "upi" | "bank" | "wire";

const fieldCls =
  "rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
const labelCls = "mb-1 block text-xs font-semibold text-stone-500 dark:text-stone-400";

const GATEWAYS = [
  { key: "cashfree" as const, name: "Cashfree", idLabel: "App ID", secretLabel: "Secret key" },
  { key: "paypal" as const, name: "PayPal", idLabel: "Client ID", secretLabel: "Client secret" },
];

/* Module level so the component identity is stable across renders — one
   defined during render remounts its subtree and drops focus mid-typing. */
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  /* No margin here on purpose. `mt-3 first:mt-0` looked right and was not:
     inside a 2-column grid every Field is a grid item, so :first-child matched
     only the FIRST cell and left every right-hand column sitting 12px lower
     than its neighbour. Spacing belongs to the parent — the grids use gap-3,
     stacked Fields use space-y-3 on MethodCard's content wrapper. */
  return (
    <div>
      <span className={labelCls}>{label}</span>
      {children}
      {hint && <p className="mt-1 text-[11px] leading-snug text-stone-400">{hint}</p>}
    </div>
  );
}

/* The visibility badge is the actual fix for the reported bug. Bank details
   were entered and never appeared, and the screen gave no clue why — because
   it never said where a field ends up. Now it does, per method. */
function MethodCard({
  title,
  visibility,
  note,
  enabled,
  onToggle,
  onVisibility,
  children,
}: {
  title: string;
  visibility: "public" | "private";
  note: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  /** Omitted for UPI — a receive-only ID is not a decision worth a switch. */
  onVisibility?: (showOnSite: boolean) => void;
  children: React.ReactNode;
}) {
  const isPublic = visibility === "public";
  const badgeCls = `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
    isPublic
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
      : "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
  }`;
  const badgeInner = isPublic ? (
    <>
      <Eye size={11} aria-hidden /> On the website
    </>
  ) : (
    <>
      <EyeOff size={11} aria-hidden /> Sent with invoices only
    </>
  );
  return (
    <div className="rounded-xl border border-stone-200 p-4 dark:border-stone-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-100">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="accent-orange-600"
          />
          {title}
        </label>
        {onVisibility ? (
          <button
            type="button"
            onClick={() => onVisibility(!isPublic)}
            title={
              isPublic
                ? "Click to stop showing these on the public payment page"
                : "Click to show these on the public payment page"
            }
            className={`${badgeCls} cursor-pointer transition-colors hover:ring-2 hover:ring-orange-300`}
          >
            {badgeInner}
          </button>
        ) : (
          <span className={badgeCls}>{badgeInner}</span>
        )}
      </div>
      <p className="mt-1 text-[11px] leading-snug text-stone-400">
        {note}
        {!isPublic && " These never appear on the public site — they print on the quotation PDF."}
      </p>
      {/* Shown only once published, and only where there is a real decision:
          a public account number gets scraped, and it lets someone quote
          real-looking details on a fake invoice. */}
      {isPublic && onVisibility && (
        <p className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] leading-snug text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          These are on the public payment page. Published account numbers get
          scraped, and they let someone quote real-looking details on a fake
          invoice — the page carries a &ldquo;confirm against your
          quotation&rdquo; warning for that reason.
        </p>
      )}
      {/* space-y-3 is what now separates stacked Fields — the QR block sits
          outside the grid and used to rely on Field's own margin. */}
      <div className={`mt-3 space-y-3 ${enabled ? "" : "opacity-50"}`}>{children}</div>
    </div>
  );
}

export default function PaymentGatewayManager({ initial }: { initial: PaymentsView }) {
  const [p, setP] = useState<PaymentsView>(initial);
  const [secrets, setSecrets] = useState<Record<string, string>>({ cashfree: "", paypal: "" });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const setGateway = (key: "cashfree" | "paypal", patch: Partial<GatewayView>) =>
    setP((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  /* Generic in the key so a patch is checked against THAT method's fields —
     writing `swift` onto `bank` is a compile error, not a silent no-op. */
  const setSimple = <K extends ManualKey>(key: K, patch: Partial<PaymentsView[K]>) =>
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

      {/* ---- UPI: the public one ---- */}
      <MethodCard
        title="UPI / QR"
        visibility="public"
        note="Shown on the payment page. A UPI ID is receive-only, so publishing it is safe."
        enabled={p.upi.enabled}
        onToggle={(v) => setSimple("upi", { enabled: v })}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="UPI ID" hint="e.g. yourname@bank">
            <input
              value={p.upi.upiId}
              onChange={(e) => setSimple("upi", { upiId: e.target.value })}
              placeholder="9718053838@ptaxis"
              maxLength={80}
              className={`${fieldCls} w-full`}
            />
          </Field>
          <Field label="Payee name" hint="Shown in the payer's UPI app">
            <input
              value={p.upi.payeeName}
              onChange={(e) => setSimple("upi", { payeeName: e.target.value })}
              placeholder="DigiSutra Solutions"
              maxLength={80}
              className={`${fieldCls} w-full`}
            />
          </Field>
        </div>
        <Field
          label="QR image"
          hint="Optional — the QR is drawn from the UPI ID automatically. Upload only if your bank's own QR encodes more."
        >
          <div className="flex flex-wrap items-center gap-2">
            <UploadButton
              accept="image/*"
              label={p.upi.qrUrl ? "Replace QR" : "Upload QR"}
              onUploaded={(url) => setSimple("upi", { qrUrl: url })}
            />
            {p.upi.qrUrl && (
              <>
                <span className="max-w-56 truncate text-xs text-stone-500">{p.upi.qrUrl}</span>
                <button
                  type="button"
                  onClick={() => setSimple("upi", { qrUrl: "" })}
                  className="cursor-pointer text-xs font-semibold text-stone-500 underline-offset-2 hover:text-red-600 hover:underline"
                >
                  Remove — go back to the generated one
                </button>
              </>
            )}
          </div>
        </Field>
      </MethodCard>

      {/* ---- Bank + wire: entered here, sent with invoices ---- */}
      <MethodCard
        title="Indian bank transfer"
        visibility={p.bank.showOnSite ? "public" : "private"}
        note="NEFT / IMPS / RTGS."
        enabled={p.bank.enabled}
        onToggle={(v) => setSimple("bank", { enabled: v })}
        onVisibility={(v) => setSimple("bank", { showOnSite: v })}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Account name">
            <input value={p.bank.accountName} onChange={(e) => setSimple("bank", { accountName: e.target.value })} placeholder="DIGISUTRA SOLUTIONS" maxLength={120} className={`${fieldCls} w-full`} />
          </Field>
          <Field label="Account number">
            <input value={p.bank.accountNumber} onChange={(e) => setSimple("bank", { accountNumber: e.target.value })} maxLength={40} className={`${fieldCls} w-full font-mono`} />
          </Field>
          <Field label="IFSC code">
            <input value={p.bank.ifsc} onChange={(e) => setSimple("bank", { ifsc: e.target.value.toUpperCase() })} maxLength={20} className={`${fieldCls} w-full font-mono`} />
          </Field>
          <Field label="Bank name">
            <input value={p.bank.bankName} onChange={(e) => setSimple("bank", { bankName: e.target.value })} placeholder="Axis Bank" maxLength={120} className={`${fieldCls} w-full`} />
          </Field>
          <Field label="Branch">
            <input value={p.bank.branch} onChange={(e) => setSimple("bank", { branch: e.target.value })} placeholder="Sector-78, Noida (U.P)" maxLength={120} className={`${fieldCls} w-full`} />
          </Field>
          <Field label="Account type">
            <input value={p.bank.accountType} onChange={(e) => setSimple("bank", { accountType: e.target.value })} placeholder="Current" maxLength={40} className={`${fieldCls} w-full`} />
          </Field>
        </div>
      </MethodCard>

      <MethodCard
        title="International wire (SWIFT)"
        visibility={p.wire.showOnSite ? "public" : "private"}
        note="USD · AED · GBP · EUR."
        enabled={p.wire.enabled}
        onToggle={(v) => setSimple("wire", { enabled: v })}
        onVisibility={(v) => setSimple("wire", { showOnSite: v })}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Beneficiary name">
            <input value={p.wire.beneficiary} onChange={(e) => setSimple("wire", { beneficiary: e.target.value })} maxLength={120} className={`${fieldCls} w-full`} />
          </Field>
          <Field label="Account / IBAN">
            <input value={p.wire.accountNumber} onChange={(e) => setSimple("wire", { accountNumber: e.target.value })} maxLength={40} className={`${fieldCls} w-full font-mono`} />
          </Field>
          <Field label="SWIFT / BIC">
            <input value={p.wire.swift} onChange={(e) => setSimple("wire", { swift: e.target.value.toUpperCase() })} maxLength={20} className={`${fieldCls} w-full font-mono`} />
          </Field>
          <Field label="Bank name">
            <input value={p.wire.bankName} onChange={(e) => setSimple("wire", { bankName: e.target.value })} maxLength={120} className={`${fieldCls} w-full`} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Bank address">
              <input value={p.wire.bankAddress} onChange={(e) => setSimple("wire", { bankAddress: e.target.value })} maxLength={200} className={`${fieldCls} w-full`} />
            </Field>
          </div>
        </div>
      </MethodCard>

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
