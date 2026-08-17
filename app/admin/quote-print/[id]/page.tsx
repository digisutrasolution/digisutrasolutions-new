import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { userCan } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getContactConfig } from "@/lib/contact-config-server";
import { getPayments } from "@/lib/payments";
import PrintButton from "@/components/admin/PrintButton";
import QuotationPayBlocks, { payBlocksFor } from "@/components/QuotationPayBlocks";
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
     than leaving one of them stale. Shared with the client-facing /q/<token>
     page — the two must never name different accounts. */
  const payBlocks = payBlocksFor(pay);

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
          <QuotationPayBlocks blocks={payBlocks} tone="print" />
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
