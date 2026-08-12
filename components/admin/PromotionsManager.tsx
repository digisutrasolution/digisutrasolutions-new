"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PromotionStatus } from "@prisma/client";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { withBase } from "@/lib/base-path";
import {
  OCCASIONS,
  OFFER_TYPES,
  occasion as occasionDef,
  offerType as offerTypeDef,
} from "@/lib/offer-kinds";
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
  offerType: string;
  occasion: string | null;
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
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:disabled:bg-stone-800";

/** ISO → the `YYYY-MM-DDTHH:mm` a datetime-local input needs, in LOCAL time.
    Slicing the ISO string instead would silently show UTC and shift an
    Indian evening deadline back by 5.5 hours. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
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
  const [showForm, setShowForm] = useState(false);
  /* null = the form is creating; a row = it is editing that row. One form, two
     jobs — a separate edit form would be the same 12 fields kept in sync by
     hand. */
  const [editing, setEditing] = useState<PromotionRow | null>(null);

  /* What the workflow will and will not accept, mirrored from
     lib/promotions-workflow so the UI never offers an edit the API refuses.
     The API is still the authority — this only stops honest mistakes. */
  const termsLocked =
    !!editing && editing.status !== "DRAFT" && editing.status !== "IN_REVIEW";
  const allLocked = editing?.status === "ENDED";

  function openCreate() {
    setEditing(null);
    setShowForm((v) => !v);
  }
  function openEdit(p: PromotionRow) {
    setEditing(p);
    setShowForm(true);
    setError(null);
  }
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

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const date = (k: string) => {
      const v = String(f.get(k) ?? "").trim();
      return v ? new Date(v).toISOString() : null;
    };

    /* Terms are omitted entirely — not sent-and-unchanged — when the offer is
       past DRAFT. commercialEditBlocked refuses a locked field the moment it
       APPEARS in the payload, so posting the same value back would 409 on an
       edit that changed nothing but the headline. */
    const terms = termsLocked
      ? {}
      : {
          discountType: String(f.get("discountType") ?? "PERCENT"),
          discountValue: Number(f.get("discountValue") ?? 10),
          codePrefix: String(f.get("codePrefix") ?? "SOCIAL"),
          offerType: String(f.get("offerType") ?? "SOCIAL_FOLLOW"),
          startsAt: date("startsAt"),
        };

    const payload = {
      name: String(f.get("name") ?? ""),
      occasion: String(f.get("occasion") ?? ""),
      headline: String(f.get("headline") ?? ""),
      body: String(f.get("body") ?? ""),
      channels: socials.map((s) => s.key).filter((k) => f.get(`ch-${k}`) === "on"),
      endsAt: date("endsAt"),
      maxClaims: f.get("maxClaims") ? Number(f.get("maxClaims")) : null,
      ...terms,
    };

    const ok = editing
      ? await call(`/api/promotions/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      : await call("/api/promotions", { method: "POST", body: JSON.stringify(payload) });

    if (ok) {
      form.reset();
      setShowForm(false);
      setEditing(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={openCreate}
          className="flex cursor-pointer items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-500"
        >
          {showForm && !editing ? <X size={15} aria-hidden /> : <Plus size={15} aria-hidden />}
          {showForm && !editing ? "Close" : "New offer"}
        </button>
        {error && (
          <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      {showForm && (
        <form
          /* Remount on target change so every defaultValue refreshes — React
             ignores a changed defaultValue on an already-mounted input, which
             would leave the previous offer's numbers in the fields. */
          key={editing?.id ?? "new"}
          onSubmit={save}
          className="mt-4 space-y-3 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
        >
          {editing && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3 dark:border-stone-800">
              <p className="text-sm font-semibold">
                Editing <span className="text-orange-700 dark:text-orange-400">{editing.name}</span>
              </p>
              <button
                type="button"
                onClick={() => { setEditing(null); setShowForm(false); }}
                className="cursor-pointer text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              >
                Cancel
              </button>
            </div>
          )}
          {termsLocked && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-snug text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              {allLocked
                ? "This offer has ended — reopen it as a draft to change anything."
                : "This offer is approved, so the terms are locked: people already hold codes on them. Wording, the end date and the code limit can still change (limits can go up, not down)."}
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label htmlFor="p-name" className={labelCls}>Internal name</label>
              <input id="p-name" name="name" required minLength={2} disabled={allLocked} defaultValue={editing?.name ?? ""} placeholder="Follow us — 10% off" className={inputCls} />
            </div>
            <div>
              <label htmlFor="p-type" className={labelCls}>Discount</label>
              <select id="p-type" name="discountType" disabled={termsLocked} defaultValue={editing?.discountType ?? "PERCENT"} className={inputCls}>
                <option value="PERCENT">Percent</option>
                <option value="AMOUNT">Fixed amount</option>
              </select>
            </div>
            <div>
              <label htmlFor="p-value" className={labelCls}>Value</label>
              <input id="p-value" name="discountValue" type="number" step="0.5" min={0} disabled={termsLocked} defaultValue={editing?.discountValue ?? 10} className={inputCls} />
            </div>
          </div>

          {/* The two axes, kept apart on purpose — see lib/offer-kinds.ts. */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="p-offertype" className={labelCls}>
                What earns it{" "}
                <span className="font-normal text-stone-400">(changes what the page asks for)</span>
              </label>
              <select id="p-offertype" name="offerType" disabled={termsLocked} defaultValue={editing?.offerType ?? "SOCIAL_FOLLOW"} className={inputCls}>
                {OFFER_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] leading-snug text-stone-500">
                {offerTypeDef(editing?.offerType).hint}
              </p>
            </div>
            <div>
              <label htmlFor="p-occasion" className={labelCls}>
                Occasion <span className="font-normal text-stone-400">(label only)</span>
              </label>
              <select id="p-occasion" name="occasion" disabled={allLocked} defaultValue={editing?.occasion ?? ""} className={inputCls}>
                <option value="">No label</option>
                {OCCASIONS.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] leading-snug text-stone-500">
                Shows as a ribbon on the offer card and groups reporting.
              </p>
            </div>
          </div>

          {/* Dates matter far more now that offers are festival/seasonal —
              one without an end date runs until somebody notices. */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="p-starts" className={labelCls}>
                Starts <span className="font-normal text-stone-400">(blank = as soon as approved)</span>
              </label>
              <input id="p-starts" name="startsAt" type="datetime-local" disabled={termsLocked} defaultValue={toLocalInput(editing?.startsAt)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="p-ends" className={labelCls}>
                Ends <span className="font-normal text-stone-400">(blank = runs until ended by hand)</span>
              </label>
              <input id="p-ends" name="endsAt" type="datetime-local" disabled={allLocked} defaultValue={toLocalInput(editing?.endsAt)} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="p-prefix" className={labelCls}>Code prefix</label>
              <input id="p-prefix" name="codePrefix" defaultValue={editing?.codePrefix ?? "SOCIAL"} disabled={termsLocked} maxLength={12} className={inputCls} />
            </div>
            <div>
              <label htmlFor="p-max" className={labelCls}>Max codes <span className="font-normal text-stone-400">(blank = unlimited)</span></label>
              <input id="p-max" name="maxClaims" type="number" min={1} disabled={allLocked} defaultValue={editing?.maxClaims ?? ""} className={inputCls} />
            </div>
            <div>
              <label htmlFor="p-headline" className={labelCls}>Headline on the page</label>
              <input id="p-headline" name="headline" maxLength={160} disabled={allLocked} defaultValue={editing?.headline ?? ""} placeholder="Follow us and take 10% off" className={inputCls} />
            </div>
          </div>
          <div>
            <label htmlFor="p-body" className={labelCls}>Body copy</label>
            <textarea id="p-body" name="body" rows={2} maxLength={600} disabled={allLocked} defaultValue={editing?.body ?? ""} className={inputCls} />
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
                    <input
                      type="checkbox"
                      name={`ch-${s.key}`}
                      disabled={allLocked}
                      defaultChecked={editing?.channels.includes(s.key) ?? false}
                      className="accent-orange-600"
                    />
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
            {editing ? "Save changes" : "Create offer"}
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
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                      {offerTypeDef(p.offerType).label}
                    </span>
                    {occasionDef(p.occasion) && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${occasionDef(p.occasion)!.className}`}>
                        {occasionDef(p.occasion)!.label}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                    Codes start {p.codePrefix}-
                    {p.maxClaims ? ` · max ${p.maxClaims}` : ""}
                    {p.endsAt ? ` · ends ${new Date(p.endsAt).toLocaleDateString("en-IN")}` : ""}
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
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(p)}
                      disabled={busy}
                      aria-label={`Edit ${p.name}`}
                      title={
                        p.status === "ENDED"
                          ? "Ended — open to read the settings"
                          : p.status === "DRAFT" || p.status === "IN_REVIEW"
                            ? "Edit"
                            : "Edit wording, end date and limit (terms are locked)"
                      }
                      className="cursor-pointer rounded-lg p-2 text-stone-400 transition-colors hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-stone-800"
                    >
                      <Pencil size={15} aria-hidden />
                    </button>
                    {/* Delete stays for drafts that were never used; the API
                        refuses once codes exist, so this is a shortcut, not a
                        second rule. */}
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
