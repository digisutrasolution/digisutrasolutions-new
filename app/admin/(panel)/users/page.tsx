import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { userCan } from "@/lib/auth/rbac";
import UsersManager from "@/components/admin/UsersManager";

export const metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "users.manage")) redirect("/admin");

  const [users, customRoles] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        customRoleId: true,
      },
    }),
    db.customRole.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Users
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Manage team accounts, roles and access.
      </p>
      <div className="mt-6">
        <UsersManager
          users={users.map((u) => ({
            ...u,
            lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
          }))}
          customRoles={customRoles}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
