import { redirect } from "next/navigation";
import { userCan, canSeeAllLeads } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import ActivityHistory from "@/components/admin/ActivityHistory";
import HelpTip from "@/components/admin/HelpTip";

export const metadata = { title: "Activity" };

export default async function ActivityPage() {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "leads.manage")) redirect("/admin");

  const assignees = await db.user.findMany({
    where: { isActive: true },
    // Role + email disambiguate the shared mailboxes in the assignee UI.
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      customRole: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight">
        Activity
        <HelpTip label="About Activity History">
          A single, filterable timeline of everything that happens across your leads. Filter by type,
          teammate or date, or search the text. You only see activity on leads you can access.
        </HelpTip>
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Everything that&apos;s happened across {canSeeAllLeads(user) ? "your leads" : "your assigned leads"} — status
        changes, assignments, notes, calls, emails, follow-ups and more.
      </p>
      <div className="mt-6">
        <ActivityHistory assignees={assignees} />
      </div>
    </div>
  );
}
