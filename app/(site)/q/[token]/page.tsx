import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getContactConfig } from "@/lib/contact-config-server";
import { getPayments } from "@/lib/payments";
import QuotationPayBlocks, { payBlocksFor } from "@/components/QuotationPayBlocks";
import {
  computeTotals,
  formatMoney,
  quoteRef,
  type QuoteItem,
} from "@/lib/quotations";

/* The client's copy of a quotation, reached only by the tokenised link we
   emailed them. Same contract as /offer/<token> and /r/<token>: the token is
   the whole authentication, and anything that does not resolve gets a plain
   not-found so a probe learns nothing. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your quotation",
  robots: { index: false, follow: false },
};

/* A link outlives the document it points at. These are the states a client can
   land in after we have moved on, and each needs an answer that is honest
   without showing prices we have withdrawn. */
const GONE: Record<string, string> = {
  SUPERSEDED:
    "This quotation has been replaced by a newer version. Please get in touch and we will send you the current one.",
  REJECTED:
    "This quotation is no longer open. Please get in touch if you would like us to prepare a new one.",
};

export default async function ClientQuotationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  // Bound the lookup before it reaches the DB — tokens are ~22 chars.
  if (!token || token.length > 64) notFound();

  const quote = await db.quotation
    .findUnique({ where: { publicToken: token } })
    .catch(() => null);
  if (!quote) notFound();

  const [contact, pay] = await Promise.all([getContactConfig(), getPayments()]);

  /* Stamp the first open only. Best-effort and never awaited into the render
     path: a failed write must not stop a client reading their quotation. */
  if (!quote.viewedAt) {
    void db.quotation
      .updateMany({
        where: { id: quote.id, viewedAt: null },
        data: { viewedAt: new Date() },
      })
      .catch(() => {});
  }

  /* Was this quotation actually emailed to someone?

     A CommLog row is written only after the provider accepts the message, so
     this is the precise question — and it is the right one. Gating on STATUS
     instead was a bug: a quotation sent while pending approval never advances
     to SENT, so its perfectly valid link 404'd for the client. Status
     describes where the document is in our workflow; it does not decide
     whether we already put a link in someone's inbox.

     It also covers the token now being written before the send: a token from
     a send that failed has no CommLog row, so it opens nothing. */
  const wasSent = await db.commLog.count({ where: { quotationId: quote.id } });
  if (wasSent === 0) notFound();

  const gone = GONE[quote.status];
  if (gone) {
    return (
      <section className="mx-auto max-w-3xl px-6 pb-20 pt-16 sm:pb-24 sm:pt-20">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-stone-900">
          This quotation is no longer current
        </h1>
        <p className="mt-3 text-base leading-relaxed text-stone-600">{gone}</p>
        <Link
          href="/contact"
          className="mt-6 inline-flex rounded-full bg-[#F26419] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-700"
        >
          Talk to us
        </Link>
      </section>
    );
  }

  const items = (quote.items as unknown as QuoteItem[]) ?? [];
  const t = computeTotals(items, quote.discountPct, quote.taxRatePct, quote.taxMode);
  const cur = quote.currency;
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const expired = !!quote.validUntil && quote.validUntil < new Date();
  const payBlocks = payBlocksFor(pay);

  return (
    <section className="mx-auto max-w-3xl px-6 pb-20 pt-12 sm:pb-24 sm:pt-16">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-orange-500 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
            Quotation
          </p>
          <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight text-stone-900">
            {quote.title || `For ${quote.clientName}`}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {contact.addressLine}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm font-bold text-stone-800">
            {quoteRef(quote.number, quote.version)}
          </p>
          <p className="text-xs text-stone-500">Date: {fmtDate(quote.createdAt)}</p>
          {quote.validUntil && (
            <p className="text-xs text-stone-500">Valid until: {fmtDate(quote.validUntil)}</p>
          )}
        </div>
      </div>

      {expired && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          The validity date on this quotation has passed. The pricing below may
          have changed — get in touch and we will confirm or refresh it.
        </p>
      )}

      <div className="mt-6 text-sm">
        <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
          Prepared for
        </p>
        <p className="mt-1 font-semibold text-stone-900">{quote.clientName}</p>
        {quote.clientCompany && <p className="text-stone-600">{quote.clientCompany}</p>}
        {quote.clientAddress && (
          <p className="whitespace-pre-wrap text-stone-600">{quote.clientAddress}</p>
        )}
        {quote.clientGstin && <p className="text-stone-600">GSTIN: {quote.clientGstin}</p>}
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
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
                  <td className="px-2 py-2 text-stone-800">{it.description || "—"}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{it.qty}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{formatMoney(it.unitPrice, cur)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{it.discountPct || 0}%</td>
                  <td className="px-2 py-2 text-right font-medium tabular-nums">{formatMoney(net, cur)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <Row label="Subtotal" value={formatMoney(t.subtotal, cur)} />
          {t.discountAmount > 0 && (
            <Row label={`Discount (${quote.discountPct}%)`} value={`− ${formatMoney(t.discountAmount, cur)}`} />
          )}
          {quote.taxMode === "CGST_SGST" && (
            <>
              <Row label={`CGST (${quote.taxRatePct / 2}%)`} value={formatMoney(t.cgst, cur)} />
              <Row label={`SGST (${quote.taxRatePct / 2}%)`} value={formatMoney(t.sgst, cur)} />
            </>
          )}
          {quote.taxMode === "IGST" && (
            <Row label={`IGST (${quote.taxRatePct}%)`} value={formatMoney(t.igst, cur)} />
          )}
          <div className="flex items-center justify-between border-t-2 border-stone-300 pt-1.5 text-base font-extrabold text-stone-900">
            <span>Total</span>
            <span className="tabular-nums">{formatMoney(t.total, cur)}</span>
          </div>
        </div>
      </div>

      {quote.notes && (
        <div className="mt-8 border-t border-stone-200 pt-4 text-sm text-stone-600">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-stone-400">
            Notes &amp; terms
          </p>
          <p className="whitespace-pre-wrap">{quote.notes}</p>
        </div>
      )}

      {/* Payment details are shown here for the same reason the PDF carries
          them: this is the document the client pays from, and the token is the
          gate. The anti-fraud line travels with them. */}
      {payBlocks.length > 0 && (
        <div className="mt-8 border-t border-stone-200 pt-4 text-xs text-stone-600">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-400">
            How to pay
          </p>
          <QuotationPayBlocks blocks={payBlocks} tone="web" />
        </div>
      )}

      <div className="mt-10 rounded-2xl bg-[#FFF6EF] p-5">
        <p className="font-display text-base font-bold text-orange-950">
          Questions, or ready to go ahead?
        </p>
        <p className="mt-1 text-sm leading-relaxed text-stone-600">
          Reply to the email this link came from, or reach us directly — we will
          walk you through anything on this page.
        </p>
        <p className="mt-3 text-sm font-semibold text-stone-800">
          {contact.mainEmail} · {contact.whatsappDisplay}
        </p>
      </div>

      <p className="mt-6 text-center text-[11px] text-stone-400">
        Quotation {quoteRef(quote.number, quote.version)} from DigiSutra
        Solutions. This page is private to you — please do not share the link.
      </p>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-stone-600">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
