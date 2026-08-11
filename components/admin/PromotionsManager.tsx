"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PromotionStatus } from "@prisma/client";
import { Plus, Trash2, X } from "lucide-react";
import { withBase } from "@/lib/base-path";
import {
  PROMOTION_RULES,
  PROMOTION_STATUS_LABEL,
  PROMOTION_STATUS_STYLE,
  availablePromotionActions,
  type PromotionAction,
} from "@/lib/promotions-workflow";

/* Social-follow offers.

   The honest framing lives in the UI as well as the code: nothing here checks
   whether anyone followed anything, because no platform lets us. What the
   admin gets is a code per lead, a claim count and a redemption count. */

export type PromotionRow = {
  id: string;
  name: string;
  status: PromotionStatus;
  statusNote: string | null;
  createdById: string | null;
  startsAt: string | null;
  discountType: string;
  discountValue: number;
  currency: string;
  headline: string;
  body: string;
  channels: string[];
  codePrefix: string;
  endsAt: string | null;
  maxClaims: number | null;
  claims: number;
  redeemed: number;
};

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";
const labelCls = "mb-1 block text-xs font-semibold";

export default function PromotionsManager({
  promotions,
  socials,
  canApprove,
  currentUserId,
}: {
  promotions: PromotionRow[];
  socials: { key: string; label: string }[];
  canApprove: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Notes are collected with prompt() rather than a bespoke modal.
     Deliberate: the note is mandatory on exactly three actions, and the
     alternative is a dialog component that exists only to hold one textarea.
     Worth revisiting if the workflow grows more note-taking steps. */
  async function transition(p: PromotionRow, action: PromotionAction) {
    const rule = PROMOTION_RULES[action];
    let note = "";
    if (rule.requiresNote) {
      const answer = window.prompt(`${rule.label} — why? This is kept on the offer.`);
      if (answer === null) return; // cancelled
      note = answer.trim();
      if (!note) {
        setError("A note is required for that action.");
        return;
      }
    } else if (action === "approve") {
      if (!window.confirm(`Approve “${p.name}”? ${rule.hint ?? ""}`)) return;
    }
    await call(`/api/promotions/${p.id}/transition`, {
      method: "POST",
      body: JSON.stringify({ action, ...(note ? { note } : {}) }),
    });
  }

  async function call(path: string, init: RequestInit): Promise<boolean> {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(withBase(path), {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Request failed.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Network error.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const ok = await call("/api/promotions", {
      method: "POST",
      body: JSON.stringify({
        name: String(f.get("name") ?? ""),
        discountType: String(f.get("discountType") ?? "PERCENT"),
        discountValue: Number(f.get("discountValue") ?? 10),
        codePrefix: String(f.get("codePrefix") ?? "SOCIAL"),
        headline: String(f.get("headline") ?? ""),
        body: String(f.get("body") ?? ""),
        channels: socials.map((s) => s.key).filter((k) => f.get(`ch-${k}`) === "on"),
        maxClaims: f.get("maxClaims") ? Number(f.get("maxClaims")) : null,
      }),
    });
    if (ok) {
      form.reset();
      setShowCreate(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex cursor-pointer items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-500"
        >
          {showCreate ? <X size={15} aria-hidden /> : <Plus size={15} aria-hidden />}
          {showCreate ? "Close" : "New offer"}
        </button>
        {error && (
          <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      {showCreate && (
        <form
          onSubmit={create}
          className="mt-4 space-y-3 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label htmlFor="p-name" className={labelCls}>Internal name</label>
              <input id="p-name" name="name" required minLength={2} placeholder="Follow us — 10% off" className={inputCls} />
            </div>
            <div>
              <label htmlFor="p-type" className={labelCls}>Discount</label>
              <select id="p-type" name="discountType" defaultValue="PERCENT" className={inputCls}>
                <option value="PERCENT">Percent</option>
                <option value="AMOUNT">Fixed amount</option>
              </select>
            </div>
            <div>
              <label htmlFor="p-value" className={labelCls}>Value</label>
              <input id="p-value" name="discountValue" type="number" step="0.5" min={0} defaultValue={10} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="p-prefix" className={labelCls}>Code prefix</label>
              <input id="p-prefix" name="codePrefix" defaultValue="SOCIAL" maxLength={12} className={inputCls} />
            </div>
            <div>
              <label htmlFor="p-max" className={labelCls}>Max codes <span className="font-normal text-stone-400">(blank = unlimited)</span></label>
              <input id="p-max" name="maxClaims" type="number" min={1} className={inputCls} />
            </div>
            <div>
              <label htmlFor="p-headline" className={labelCls}>Headline on the page</label>
              <input id="p-headline" name="headline" maxLength={160} placeholder="Follow us and take 10% off" className={inputCls} />
            </div>
          </div>
          <div>
            <label htmlFor="p-body" className={labelCls}>Body copy</label>
            <textarea id="p-body" name="body" rows={2} maxLength={600} className={inputCls} />
          </div>
          {socials.length > 0 && (
            <div>
              <p className={labelCls}>
                Which profiles to show{" "}
                <span className="font-normal text-stone-400">(none ticked = all of them)</span>
              </p>
              <div className="flex flex-wrap gap-3">
                {socials.map((s) => (
                  <label key={s.key} className="flex cursor-pointer items-center gap-1.5 text-xs font-medium">
                    <input type="checkbox" name={`ch-${s.key}`} className="accent-orange-600" />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="cursor-pointer rounded-xl bg-stone-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-60 dark:bg-orange-600"
          >
            Create offer
          </button>
        </form>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500 dark:border-stone-800 dark:text-stone-400">
              <th className="px-5 py-3 font-semibold">Offer</th>
              <th className="px-5 py-3 font-semibold">Discount</th>
              <th className="px-4 py-3 text-right font-semibold" title="Codes issued">Claimed</th>
              <th className="px-4 py-3 text-right font-semibold" title="Codes actually used on a quote">Redeemed</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Workflow</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promotions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-stone-500">
                  No offers yet. Create one, then use “Offer link” on a lead to send it.
                </td>
              </tr>
            )}
            {promotions.map((p) => (
              <tr key={p.id} className="border-b border-stone-100 last:border-0 dark:border-stone-800">
                <td className="px-5 py-3">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Codes start {p.codePrefix}-
                    {p.maxClaims ? ` · max ${p.maxClaims}` : ""}
                  </p>
                </td>
                <td className="px-5 py-3 text-xs text-stone-600 dark:text-stone-300">
                  {p.discountType === "AMOUNT"
                    ? `${p.currency} ${p.discountValue.toLocaleString("en-IN")}`
                    : `${p.discountValue}%`}
                </td>
                <td className="px-4 py-3 text-right text-xs tabular-nums text-stone-600 dark:text-stone-300">
                  {p.claims}
                </td>
                <td className="px-4 py-3 text-right text-xs tabular-nums">
                  <span className={p.redeemed ? "font-semibold text-[#F26419]" : "text-stone-400"}>
                    {p.redeemed}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${PROMOTION_STATUS_STYLE[p.status]}`}
                  >
                    {PROMOTION_STATUS_LABEL[p.status]}
                  </span>
                  {p.statusNote && (
                    <p className="mt-1 max-w-56 text-[11px] leading-snug text-stone-500" title={p.statusNote}>
                      {p.statusNote}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {availablePromotionActions(p.status, {
                      can: (perm) => (perm === "promos.approve" ? canApprove : true),
                      isAuthor: p.createdById === currentUserId,
                    }).map((action) => {
                      const rule = PROMOTION_RULES[action];
                      return (
                        <button
                          key={action}
                          onClick={() => void transition(p, action)}
                          disabled={busy}
                          title={rule.hint}
                          className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                            action === "approve"
                              ? "bg-emerald-600 text-white hover:bg-emerald-500"
                              : action === "submit"
                                ? "bg-[#F26419] text-white hover:bg-orange-600"
                                : "border border-stone-300 text-stone-600 hover:border-stone-400 dark:border-stone-700 dark:text-stone-300"
                          }`}
                        >
                          {rule.label}
                        </button>
                      );
                    })}
                    {/* Only reason the author sees nothing on their own draft in
                        review — say so instead of showing an empty cell. */}
                    {p.status === "IN_REVIEW" && p.createdById === currentUserId && (
                      <span className="text-[11px] text-stone-400">
                        Waiting on someone else to approve
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => {
                      if (!window.confirm(`Delete “${p.name}”?`)) return;
                      void call(`/api/promotions/${p.id}`, { method: "DELETE" });
                    }}
                    disabled={busy}
                    aria-label={`Delete ${p.name}`}
                    className="cursor-pointer rounded-lg p-2 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-stone-800"
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
