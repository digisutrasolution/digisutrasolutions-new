import { notFound, redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import QuotationEditor from "@/components/admin/QuotationEditor";
import type { QuoteItem } from "@/lib/quotations";

export const metadata = { title: "Quotation" };

export default async function QuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || !can(user.role, "quotes.manage")) redirect("/admin");

  const quote = await db.quotation.findUnique({ where: { id } });
  if (!quote) notFound();

  const initial = {
    id: quote.id,
    number: quote.number,
    version: quote.version,
    status: quote.status,
    leadId: quote.leadId,
    clientName: quote.clientName,
    clientCompany: quote.clientCompany ?? "",
    clientEmail: quote.clientEmail ?? "",
    clientPhone: quote.clientPhone ?? "",
    clientAddress: quote.clientAddress ?? "",
    clientGstin: quote.clientGstin ?? "",
    title: quote.title,
    notes: quote.notes,
    currency: quote.currency,
    items: (quote.items as unknown as QuoteItem[]) ?? [],
    discountPct: quote.discountPct,
    taxRatePct: quote.taxRatePct,
    taxMode: quote.taxMode,
    validUntil: quote.validUntil ? quote.validUntil.toISOString().slice(0, 10) : "",
  };

  return <QuotationEditor initial={initial} canApprove={can(user.role, "quotes.approve")} />;
}
