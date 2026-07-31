import { redirect } from "next/navigation";
import { userCan } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { currentMatrix } from "@/lib/auth/rbac";
import { ensureRbacLoaded } from "@/lib/auth/rbac-server";
import RolesMatrix from "@/components/admin/RolesMatrix";
import CustomRolesManager from "@/components/admin/CustomRolesManager";

export const metadata = { title: "Roles & permissions" };

export default async function RolesPage() {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "roles.manage")) redirect("/admin");

  await ensureRbacLoaded(true);
  const matrix = currentMatrix();

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Roles &amp; permissions
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
        Decide exactly what each role can do. Changes apply within seconds — no
        redeploy. Super Admin always has every permission and can&apos;t be
        limited here, so you can never lock yourself out.
      </p>
      <div className="mt-6">
        <RolesMatrix initialMatrix={matrix} />
        <CustomRolesManager />
      </div>
    </div>
  );
}
