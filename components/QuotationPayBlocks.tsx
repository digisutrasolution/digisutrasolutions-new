import { detailRows, noteAddsSomething, type Payments } from "@/lib/payments";

/* "How to pay" for a quotation.
   Shared by the admin print view and the client-facing /q/<token> page, which
   must never disagree about which account the client is asked to pay into.
   The note-suppression rule and the field list have enough judgement in them
   now that two copies would drift. */

export type PayBlock = {
  title: string;
  rows: { label: string; value: string }[];
  note: string;
};

/**
 * Rows are built first and the note judged against them: a note only survives
 * if it says something the rows do not. Legacy notes hold the whole account
 * block as one run-on line, which printed as a duplicate under the tidy rows.
 * A method with nothing filled in produces no block at all — an empty "Bank
 * transfer" heading on a client-facing document is worse than its absence.
 */
export function payBlocksFor(pay: Payments): PayBlock[] {
  const block = (
    show: boolean,
    title: string,
    pairs: [string, string | undefined][],
    note: string,
  ): PayBlock | null => {
    if (!show) return null;
    const rows = detailRows(pairs);
    if (rows.length === 0) return null;
    return { title, rows, note: noteAddsSomething(note, rows) ? note.trim() : "" };
  };

  return [
    block(
      pay.upi.enabled && !!pay.upi.upiId.trim(),
      "UPI (India)",
      [
        ["UPI ID", pay.upi.upiId],
        ["Name", pay.upi.payeeName],
      ],
      pay.upi.note,
    ),
    block(
      pay.bank.enabled,
      "Bank transfer (India · NEFT / IMPS / RTGS)",
      [
        ["Account name", pay.bank.accountName],
        ["Account no", pay.bank.accountNumber],
        ["IFSC", pay.bank.ifsc],
        ["Bank", pay.bank.bankName],
        ["Branch", pay.bank.branch],
        ["Type", pay.bank.accountType],
      ],
      pay.bank.note,
    ),
    block(
      pay.wire.enabled,
      "International wire (SWIFT)",
      [
        ["Beneficiary", pay.wire.beneficiary],
        ["Account / IBAN", pay.wire.accountNumber],
        /* Routing next to the account number — the pair a domestic US
           transfer needs; SWIFT follows for the international route. */
        ["Routing number", pay.wire.routingNumber],
        ["SWIFT / BIC", pay.wire.swift],
        ["Bank", pay.wire.bankName],
        ["Bank address", pay.wire.bankAddress],
      ],
      pay.wire.note,
    ),
  ].filter((b): b is PayBlock => b !== null);
}

/**
 * The rendered block. `tone` exists because the same content appears on white
 * print stock and on the cream client page, which want different neutrals —
 * everything else about it must stay identical.
 */
export default function QuotationPayBlocks({
  blocks,
  tone = "print",
}: {
  blocks: PayBlock[];
  tone?: "print" | "web";
}) {
  if (blocks.length === 0) return null;
  const muted = tone === "print" ? "text-stone-400" : "text-stone-500";
  const strong = tone === "print" ? "text-stone-800" : "text-stone-900";

  return (
    <>
      {/* CSS columns rather than a grid: the blocks are very different heights
          (bank has six rows, UPI two) and a 2-col grid left a hole under the
          short one. break-inside-avoid stops one splitting across a PDF page. */}
      <div className="columns-1 gap-6 sm:columns-2">
        {blocks.map((b) => (
          <div key={b.title} className="mb-3 break-inside-avoid">
            <div className={`font-bold ${strong}`}>{b.title}</div>
            <dl className="mt-0.5">
              {b.rows.map((r) => (
                <div key={r.label} className="flex gap-1.5">
                  <dt className={`shrink-0 ${muted}`}>{r.label}:</dt>
                  {/* break-words, not break-all: break-all split a postcode
                      mid-number. Tabular figures so an account number cannot
                      be misread off a printed page. */}
                  <dd className={`break-words font-medium tabular-nums ${strong}`}>
                    {r.value}
                  </dd>
                </div>
              ))}
            </dl>
            {b.note && <p className={`mt-0.5 ${muted}`}>{b.note}</p>}
          </div>
        ))}
      </div>
      <p className={`mt-2.5 text-[10px] leading-snug ${muted}`}>
        Always confirm these details against a quotation sent from our own
        domain before transferring. We never change bank details by email.
      </p>
    </>
  );
}
