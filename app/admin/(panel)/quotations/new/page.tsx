import { redirect } from "next/navigation";
import { userCan } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import QuotationEditor from "@/components/admin/QuotationEditor";

export const metadata = { title: "New quotation" };

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "quotes.manage")) redirect("/admin");

  const { leadId } = await searchParams;
  const lead = leadId
    ? await db.lead.findFirst({
        where: { id: leadId, deletedAt: null },
        select: { id: true, name: true, company: true, email: true, whatsapp: true, address: true },
      })
    : null;

  const initial = {
    leadId: lead?.id ?? null,
    clientName: lead?.name ?? "",
    clientCompany: lead?.company ?? "",
    clientEmail: lead?.email ?? "",
    clientPhone: lead?.whatsapp ?? "",
    clientAddress: lead?.address ?? "",
    clientGstin: "",
    title: "",
    notes: "",
    currency: "INR",
    items: [{ description: "", qty: 1, unitPrice: 0, discountPct: 0 }],
    discountPct: 0,
    taxRatePct: 18,
    taxMode: "CGST_SGST",
    validUntil: "",
  };

  return <QuotationEditor initial={initial} />;
}
