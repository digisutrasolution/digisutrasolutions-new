import { redirect } from "next/navigation";
import { userCan } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { currentMatrix, permissionsAddedSinceSave, rbacMatrixIsLegacy, PERMISSION_META } from "@/lib/auth/rbac";
import { ensureRbacLoaded } from "@/lib/auth/rbac-server";
import { db } from "@/lib/db";
import RolesWorkspace from "@/components/admin/RolesWorkspace";

export const metadata = { title: "Roles & permissions" };

export default async function RolesPage() {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "roles.manage")) redirect("/admin");

  await ensureRbacLoaded(true);
  const matrix = currentMatrix();
  /* Permissions a later release added that the saved matrix never saw. They
     are following their code defaults; one save records them explicitly. */
  const addedSinceSave = permissionsAddedSinceSave().map((p) => ({
    key: p,
    label: PERMISSION_META[p].label,
  }));
  const legacyMatrix = rbacMatrixIsLegacy();

  // Users per system role (excluding those overridden by a custom role) +
  // Super Admin, for the counts shown next to each role.
  const grouped = await db.user.groupBy({
    by: ["role"],
    where: { isActive: true, customRoleId: null },
    _count: { role: true },
  });
  const systemCounts: Record<string, number> = {};
  for (const g of grouped) systemCounts[g.role] = g._count.role;

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Roles &amp; permissions
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
        Pick a role to see and edit what it can do. Changes apply within seconds
        — no redeploy. Super Admin always has everything, so you can never lock
        yourself out.
      </p>
      <div className="mt-6">
        <RolesWorkspace initialMatrix={matrix} systemCounts={systemCounts} addedSinceSave={addedSinceSave} legacyMatrix={legacyMatrix} />
      </div>
    </div>
  );
}
