import { redirect } from "next/navigation";
import { userCan } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import FollowUpsBoard from "@/components/admin/FollowUpsBoard";

export const metadata = { title: "Follow-ups" };

export default async function FollowUpsPage() {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "leads.manage")) redirect("/admin");

  const assignees = await db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Follow-ups
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Every scheduled next-touch across the pipeline. Reminders ping the owner
        as each falls due; anything left overdue escalates to the admins.
      </p>
      <div className="mt-6">
        <FollowUpsBoard
          assignees={assignees}
          currentUserId={user.id}
          canRunCron={userCan(user, "users.manage")}
        />
      </div>
    </div>
  );
}
