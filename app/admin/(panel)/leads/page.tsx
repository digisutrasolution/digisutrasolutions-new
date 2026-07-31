import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getScoringConfig } from "@/lib/scoring-server";
import LeadsWorkspace from "@/components/admin/LeadsWorkspace";

export const metadata = { title: "Leads" };

export default async function AdminLeadsPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "leads.manage")) redirect("/admin");

  const [assignees, scoringConfig] = await Promise.all([
    db.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getScoringConfig(),
  ]);
  const canManageRules = can(user.role, "leads.rules");

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Leads
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Every enquiry from the website, forms, audit and chatbot — plus manual
        entries. Filter, assign and click a lead to open its full record.
      </p>
      <div className="mt-6">
        <LeadsWorkspace
          assignees={assignees}
          canManageRules={canManageRules}
          canViewAll={can(user.role, "leads.viewAll")}
          scoringConfig={scoringConfig}
        />
      </div>
    </div>
  );
}
