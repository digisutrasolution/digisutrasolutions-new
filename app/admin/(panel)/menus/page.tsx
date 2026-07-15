import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import MenusManager from "@/components/admin/MenusManager";

export const metadata = { title: "Menus" };

export default async function AdminMenusPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "menus.manage")) redirect("/admin");

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Menus
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        The site header navigation. Edit the draft freely — visitors keep
        seeing the last published menu until you press Publish.
      </p>
      <div className="mt-6">
        <MenusManager />
      </div>
    </div>
  );
}
