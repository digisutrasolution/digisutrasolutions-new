import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import LeadsManager from "@/components/admin/LeadsManager";

export const metadata = { title: "Leads" };

export default async function AdminLeadsPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "leads.manage")) redirect("/admin");

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Leads
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Every enquiry from the contact page, audit band and estimator. Click a
        row for details and notes; the WhatsApp number opens a chat directly.
      </p>
      <div className="mt-6">
        <LeadsManager />
      </div>
    </div>
  );
}
