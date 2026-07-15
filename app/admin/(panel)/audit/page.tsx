import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";

export const metadata = { title: "Audit log" };

export default async function AdminAuditPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "audit.read")) redirect("/admin");

  const entries = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Audit log
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Last 100 recorded events, newest first.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500 dark:border-stone-800 dark:text-stone-400">
              <th className="px-5 py-3 font-semibold">When</th>
              <th className="px-5 py-3 font-semibold">Actor</th>
              <th className="px-5 py-3 font-semibold">Action</th>
              <th className="px-5 py-3 font-semibold">Entity</th>
              <th className="px-5 py-3 font-semibold">IP</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-stone-500">
                  No events recorded yet.
                </td>
              </tr>
            )}
            {entries.map((e) => (
              <tr
                key={e.id}
                className="border-b border-stone-100 last:border-0 dark:border-stone-800"
              >
                <td className="whitespace-nowrap px-5 py-3 text-xs text-stone-500 dark:text-stone-400">
                  {e.createdAt.toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "medium",
                  })}
                </td>
                <td className="px-5 py-3">
                  {e.user ? (
                    <>
                      <p className="font-medium">{e.user.name}</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">{e.user.email}</p>
                    </>
                  ) : (
                    <span className="text-stone-400">—</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                    {e.action}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-stone-600 dark:text-stone-300">
                  {e.entity}
                  {e.entityId ? ` · ${e.entityId.slice(0, 10)}…` : ""}
                </td>
                <td className="px-5 py-3 text-xs text-stone-500 dark:text-stone-400">
                  {e.ip ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
