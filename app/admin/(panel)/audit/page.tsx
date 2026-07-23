import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import AuditTable from "@/components/admin/AuditTable";

export const metadata = { title: "Audit log" };

export default async function AdminAuditPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "audit.read")) redirect("/admin");

  const entries = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Audit log
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Last 500 recorded events, newest first.
      </p>

      <AuditTable entries={entries} />
    </div>
  );
}
