import { redirect } from "next/navigation";
import { userCan, canSeeAllLeads } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import ActivityHistory from "@/components/admin/ActivityHistory";

export const metadata = { title: "Activity" };

export default async function ActivityPage() {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "leads.manage")) redirect("/admin");

  const assignees = await db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Activity</h1>
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
