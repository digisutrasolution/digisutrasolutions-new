import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import QuotationsList from "@/components/admin/QuotationsList";

export const metadata = { title: "Quotations" };

export default async function QuotationsPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "quotes.manage")) redirect("/admin");

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Quotations</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Build, approve and track sales quotations. Prices include GST; each
        quote can be revised into a new version and printed to PDF.
      </p>
      <div className="mt-6">
        <QuotationsList />
      </div>
    </div>
  );
}
