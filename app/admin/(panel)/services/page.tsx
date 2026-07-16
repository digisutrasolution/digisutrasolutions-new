import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import ServicesManager from "@/components/admin/ServicesManager";

export const metadata = { title: "Services" };

export default async function AdminServicesPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "services.manage")) redirect("/admin");

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Services
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        The service catalog powers /services, the category pages, menus and the
        home studios. Changes go live immediately; hidden items disappear
        everywhere.
      </p>
      <div className="mt-6">
        <ServicesManager />
      </div>
    </div>
  );
}
