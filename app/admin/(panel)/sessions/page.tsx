import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import SessionsExplorer from "@/components/admin/SessionsExplorer";

export const metadata = { title: "Sessions" };

export default async function AdminSessionsPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "analytics.view")) redirect("/admin");

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Session history
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Every visit, grouped into sessions with device, location and the full
        page journey. Cookieless — sessions use an ephemeral per-tab key, never
        a persistent identifier.
      </p>
      <div className="mt-6">
        <SessionsExplorer />
      </div>
    </div>
  );
}
