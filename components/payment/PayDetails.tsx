"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/* Bank / SWIFT details on the public page, shown only when that method's
   "show on the website" switch is on (see getPublicPayments — the fields are
   absent from the payload entirely when it is off).

   Copy buttons on every row because these are the values people mistype: an
   account number, an IFSC and a SWIFT code are long strings of characters with
   no meaning to the person retyping them. */

export type DetailRow = { label: string; value: string };

export default function PayDetails({
  title,
  rows,
}: {
  title: string;
  rows: DetailRow[];
}) {
  const [copied, setCopied] = useState<string | null>(null);

  if (rows.length === 0) return null;

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* Clipboard blocked. The value is on screen and selectable, so the row
         still does its job. */
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-stone-500">
        {title}
      </p>
      <dl className="mt-2.5 space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <dt className="w-28 shrink-0 text-xs text-stone-500">{r.label}</dt>
            <dd className="flex min-w-0 flex-1 items-center gap-1.5">
              {/* tabular-nums so a long account number cannot be misread, and
                  select-all so a tap selects the whole value. */}
              <span className="min-w-0 break-all font-mono text-sm font-semibold tabular-nums text-stone-900 select-all">
                {r.value}
              </span>
              <button
                type="button"
                onClick={() => copy(r.label, r.value)}
                aria-label={`Copy ${r.label}`}
                className="shrink-0 cursor-pointer rounded p-1 text-stone-400 transition-colors hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F26419]"
              >
                {copied === r.label ? (
                  <Check size={13} aria-hidden />
                ) : (
                  <Copy size={13} aria-hidden />
                )}
              </button>
            </dd>
          </div>
        ))}
      </dl>
      {/* The standard defence against invoice-redirection fraud, which is the
          risk publishing these creates in the first place. */}
      <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
        Always confirm these against a quotation sent from our own domain before
        transferring. We never change bank details by email.
      </p>
    </div>
  );
}
