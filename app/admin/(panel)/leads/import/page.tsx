import { redirect } from "next/navigation";
import { userCan } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import LeadImport from "@/components/admin/LeadImport";

export const metadata = { title: "Import leads" };

export default async function ImportLeadsPage() {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "leads.manage")) redirect("/admin");

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Import leads</h1>
      <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
        Upload a CSV, map the columns, and import. Duplicates (same WhatsApp or
        email as an existing lead) are skipped automatically; new leads are
        scored on arrival.
      </p>
      <div className="mt-6">
        <LeadImport />
      </div>
    </div>
  );
}
