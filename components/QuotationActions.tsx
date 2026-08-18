"use client";

import { useState } from "react";
import { Check, Printer, X } from "lucide-react";
import { withBase } from "@/lib/base-path";

/** Print on its own, for states where accepting is closed but the client
    still wants the document (an expired or already-decided quotation). */
export function PrintQuotationButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print flex items-center gap-2 rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-600 transition-colors hover:border-stone-400 hover:text-stone-800"
    >
      <Printer size={15} aria-hidden /> Print / Save as PDF
    </button>
  );
}

/**
 * The client's accept / decline / print bar on /q/<token>.
 *
 * Accepting a quotation is the moment money is agreed, so it is deliberately
 * two steps rather than one button: the confirm panel restates the total and
 * asks for a name. Nothing here is reversible from this page — a change of
 * mind is a conversation, not another click.
 */
export default function QuotationActions({
  token,
  total,
  reference,
  clientName,
  decided,
}: {
  token: string;
  total: string;
  reference: string;
  clientName: string;
  /** Already accepted or declined — the bar shows the outcome instead. */
  decided: null | { status: "ACCEPTED" | "REJECTED"; by: string | null; at: string | null };
}) {
  const [mode, setMode] = useState<null | "accept" | "reject">(null);
  const [name, setName] = useState(clientName);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<null | "ACCEPTED" | "REJECTED">(null);

  const outcome = done ?? decided?.status ?? null;

  async function submit(decision: "accept" | "reject") {
    if (decision === "accept" && !name.trim()) {
      setErr("Please type your name to confirm.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(withBase(`/api/quotations/public/${token}/decision`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, name: name.trim(), note: note.trim() }),
      });
      const json = await res.json().catch(() => ({ ok: false }));
      if (!json.ok) {
        setErr(json.error ?? "Something went wrong. Please email us instead.");
        return;
      }
      setDone(json.status);
      setMode(null);
    } catch {
      setErr("Could not reach us just now. Please reply to the email instead.");
    } finally {
      setBusy(false);
    }
  }

  if (outcome) {
    const accepted = outcome === "ACCEPTED";
    return (
      <div
        className={`mt-8 rounded-2xl border p-5 ${
          accepted ? "border-green-200 bg-green-50" : "border-stone-200 bg-stone-50"
        }`}
      >
        <p className={`font-display text-base font-bold ${accepted ? "text-green-900" : "text-stone-800"}`}>
          {accepted ? `Accepted — thank you.` : "Declined"}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-stone-600">
          {accepted
            ? `We have been notified and will be in touch to get ${reference} underway. Payment details are above whenever you are ready.`
            : "Thanks for letting us know — we have told the team. If anything here was close but not quite right, just reply to the email and we will rework it."}
        </p>
        {decided?.by && decided.at && (
          <p className="mt-2 text-xs text-stone-500">
            Recorded for {decided.by} on{" "}
            {new Date(decided.at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}
      </div>
    );
  }

  return (
    /* no-print: a printed quotation is a document, not a form. */
    <div className="no-print mt-8">
      {mode === null && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => { setMode("accept"); setErr(""); }}
            className="flex items-center gap-2 rounded-full bg-[#F26419] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-700"
          >
            <Check size={16} aria-hidden /> Accept this quotation
          </button>
          <button
            onClick={() => { setMode("reject"); setErr(""); }}
            className="flex items-center gap-2 rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-600 transition-colors hover:border-stone-400 hover:text-stone-800"
          >
            <X size={15} aria-hidden /> Decline
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-600 transition-colors hover:border-stone-400 hover:text-stone-800"
          >
            <Printer size={15} aria-hidden /> Print / Save as PDF
          </button>
        </div>
      )}

      {mode === "accept" && (
        <div className="rounded-2xl border border-orange-200 bg-[#FFF9F5] p-5">
          {/* The total is restated here on purpose — this is the last screen
              before it becomes an agreement. */}
          <p className="font-display text-base font-bold text-orange-950">
            Accept {reference} for {total}?
          </p>
          <p className="mt-1 text-sm leading-relaxed text-stone-600">
            We will start work on this and send an invoice. Type your name to
            confirm you are authorised to accept it.
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            aria-label="Your full name"
            className="mt-3 w-full max-w-sm rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={() => void submit("accept")}
              disabled={busy}
              className="rounded-full bg-[#F26419] px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {busy ? "Confirming…" : "Confirm acceptance"}
            </button>
            <button onClick={() => setMode(null)} className="text-sm font-semibold text-stone-500 hover:text-stone-800">
              Back
            </button>
          </div>
        </div>
      )}

      {mode === "reject" && (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
          <p className="font-display text-base font-bold text-stone-900">
            Decline {reference}?
          </p>
          <p className="mt-1 text-sm leading-relaxed text-stone-600">
            If you can tell us why, we will use it — often it is something we
            can fix in a revision.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Budget, timing, scope… (optional)"
            aria-label="Reason (optional)"
            className="mt-3 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={() => void submit("reject")}
              disabled={busy}
              className="rounded-full bg-stone-800 px-6 py-2.5 text-sm font-bold text-white hover:bg-stone-700 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send"}
            </button>
            <button onClick={() => setMode(null)} className="text-sm font-semibold text-stone-500 hover:text-stone-800">
              Back
            </button>
          </div>
        </div>
      )}

      {err && <p className="mt-3 text-sm font-semibold text-red-600">{err}</p>}
    </div>
  );
}
