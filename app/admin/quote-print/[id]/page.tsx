import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { userCan } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getContactConfig } from "@/lib/contact-config-server";
import { detailRows, getPayments, noteAddsSomething } from "@/lib/payments";
import PrintButton from "@/components/admin/PrintButton";
import {
  computeTotals,
  formatMoney,
  quoteRef,
  quoteStatusLabel,
  type QuoteItem,
} from "@/lib/quotations";

export const metadata = { title: "Quotation" };

export default async function QuotationPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || !userCan(user, "quotes.manage")) redirect("/admin/login");

  const [quote, contact, pay] = await Promise.all([
    db.quotation.findUnique({ where: { id } }),
    getContactConfig(),
    /* getPayments(), not getPublicPayments() — this page is behind
       quotes.manage and its whole job is to carry the private details. */
    getPayments(),
  ]);
  if (!quote) notFound();

  const items = (quote.items as unknown as QuoteItem[]) ?? [];
  const t = computeTotals(items, quote.discountPct, quote.taxRatePct, quote.taxMode);
  const cur = quote.currency;
  const fmtDate = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  /* Built from the same settings the payment page reads, so switching a method
     off in Settings removes it from the website AND from new quotations rather
     than leaving one of them stale. Rows with no value are dropped, and a
     method with nothing filled in produces no block at all — an empty "Bank
     transfer" heading on a client-facing PDF is worse than its absence. */
  type PayBlock = { title: string; rows: { label: string; value: string }[]; note: string };

  /* Rows are built once and the note is judged against them: it only survives
     if it says something the rows do not (see noteAddsSomething). Legacy notes
     hold the entire account block as one run-on line, which printed as a
     duplicate directly beneath the tidy rows. */
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

  const payBlocks = [
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
        /* Routing sits next to the account number — that is the pair a domestic
           US transfer needs; SWIFT follows for the international route. */
        ["Routing number", pay.wire.routingNumber],
        ["SWIFT / BIC", pay.wire.swift],
        ["Bank", pay.wire.bankName],
        ["Bank address", pay.wire.bankAddress],
      ],
      pay.wire.note,
    ),
  ].filter((b): b is PayBlock => b !== null);

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-stone-800">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 14mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={`/admin/quotations/${quote.id}`} className="text-sm text-stone-500 hover:text-orange-600">← Back to quotation</Link>
        <PrintButton />
      </div>

      {/* Letterhead */}
      <div className="flex items-start justify-between border-b-2 border-orange-500 pb-4">
        <div>
          <div className="text-2xl font-extrabold tracking-tight">DigiSutra Solutions</div>
          <div className="text-sm text-stone-500">Your growth, our sutra.</div>
          <div className="mt-2 text-xs text-stone-500">
            {contact.addressLine}<br />
            {contact.mainEmail} · {contact.whatsappDisplay}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold uppercase tracking-wide text-orange-600">Quotation</div>
          <div className="mt-1 font-mono text-sm font-semibold">{quoteRef(quote.number, quote.version)}</div>
          <div className="text-xs text-stone-500">Date: {fmtDate(quote.createdAt)}</div>
          {quote.validUntil && <div className="text-xs text-stone-500">Valid until: {fmtDate(quote.validUntil)}</div>}
          <div className="mt-1 text-xs font-semibold text-stone-600">{quoteStatusLabel(quote.status)}</div>
        </div>
      </div>

      {/* Bill to */}
      <div className="mt-5 grid grid-cols-2 gap-6 text-sm">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Quotation for</div>
          <div className="mt-1 font-semibold">{quote.clientName}</div>
          {quote.clientCompany && <div>{quote.clientCompany}</div>}
          {quote.clientAddress && <div className="whitespace-pre-wrap text-stone-600">{quote.clientAddress}</div>}
          <div className="mt-1 text-stone-600">
            {[quote.clientEmail, quote.clientPhone].filter(Boolean).join(" · ")}
          </div>
          {quote.clientGstin && <div className="text-stone-600">GSTIN: {quote.clientGstin}</div>}
        </div>
        {quote.title && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Subject</div>
            <div className="mt-1 font-medium">{quote.title}</div>
          </div>
        )}
      </div>

      {/* Items */}
      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-y border-stone-300 bg-stone-50 text-left">
            <th className="px-2 py-2">#</th>
            <th className="px-2 py-2">Description</th>
            <th className="px-2 py-2 text-right">Qty</th>
            <th className="px-2 py-2 text-right">Unit price</th>
            <th className="px-2 py-2 text-right">Disc%</th>
            <th className="px-2 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => {
            const gross = (it.qty || 0) * (it.unitPrice || 0);
            const net = gross - gross * ((it.discountPct || 0) / 100);
            return (
              <tr key={i} className="border-b border-stone-200">
                <td className="px-2 py-2 text-stone-400">{i + 1}</td>
                <td className="px-2 py-2">{it.description || "—"}</td>
                <td className="px-2 py-2 text-right tabular-nums">{it.qty}</td>
                <td className="px-2 py-2 text-right tabular-nums">{formatMoney(it.unitPrice, cur)}</td>
                <td className="px-2 py-2 text-right tabular-nums">{it.discountPct || 0}%</td>
                <td className="px-2 py-2 text-right font-medium tabular-nums">{formatMoney(net, cur)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <Row label="Subtotal" value={formatMoney(t.subtotal, cur)} />
          {t.discountAmount > 0 && <Row label={`Discount (${quote.discountPct}%)`} value={`− ${formatMoney(t.discountAmount, cur)}`} />}
          {quote.taxMode === "CGST_SGST" && (
            <>
              <Row label={`CGST (${quote.taxRatePct / 2}%)`} value={formatMoney(t.cgst, cur)} />
              <Row label={`SGST (${quote.taxRatePct / 2}%)`} value={formatMoney(t.sgst, cur)} />
            </>
          )}
          {quote.taxMode === "IGST" && <Row label={`IGST (${quote.taxRatePct}%)`} value={formatMoney(t.igst, cur)} />}
          <div className="flex items-center justify-between border-t-2 border-stone-300 pt-1.5 text-base font-extrabold">
            <span>Total</span><span className="tabular-nums">{formatMoney(t.total, cur)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div className="mt-6 border-t border-stone-200 pt-3 text-xs text-stone-600">
          <div className="mb-1 font-bold uppercase tracking-wide text-stone-400">Notes &amp; terms</div>
          <div className="whitespace-pre-wrap">{quote.notes}</div>
        </div>
      )}

      {/* How to pay.
          This is where the private payment details finally land. They are
          entered in Settings → Payments and deliberately kept off the public
          site (a published account number gets scraped and lets anyone quote
          real-looking details on a fake invoice), so the quotation is the
          channel that actually carries them. Before this block the page had no
          payment details at all — "details arrive with your invoice" was true
          nowhere. */}
      {payBlocks.length > 0 && (
        <div className="mt-6 break-inside-avoid border-t border-stone-200 pt-3 text-xs text-stone-600">
          <div className="mb-2 font-bold uppercase tracking-wide text-stone-400">How to pay</div>
          {/* CSS columns rather than a grid. The three blocks are very
              different heights (bank has six rows, UPI two), and a 2-col grid
              left a hole under the short one while the next block started a
              fresh row. Columns flow the blocks so they fill, and
              break-inside-avoid stops one splitting across a page in the PDF. */}
          <div className="columns-1 gap-6 sm:columns-2">
            {payBlocks.map((b) => (
              <div key={b.title} className="mb-3 break-inside-avoid">
                <div className="font-bold text-stone-800">{b.title}</div>
                <dl className="mt-0.5">
                  {b.rows.map((r) => (
                    <div key={r.label} className="flex gap-1.5">
                      <dt className="shrink-0 text-stone-400">{r.label}:</dt>
                      {/* break-words, not break-all: break-all split a postcode
                          mid-number ("NY 100 / 01"). Tabular figures so an
                          account number cannot be misread off a printed page. */}
                      <dd className="break-words font-medium tabular-nums text-stone-800">
                        {r.value}
                      </dd>
                    </div>
                  ))}
                </dl>
                {b.note && <p className="mt-0.5 text-stone-500">{b.note}</p>}
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[10px] leading-snug text-stone-400">
            Always confirm these details against a quotation sent from our own
            domain before transferring. We never change bank details by email.
          </p>
        </div>
      )}

      <div className="mt-8 text-center text-[11px] text-stone-400">
        This is a computer-generated quotation and does not require a signature.
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-stone-600">
      <span>{label}</span><span className="tabular-nums">{value}</span>
    </div>
  );
}
