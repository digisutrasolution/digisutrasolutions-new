import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/rbac";
import type { Role } from "@prisma/client";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  const [totalUsers, byRole, activeSessions, recentAudit, inTesting, awaitingApproval, openBugs] =
    await Promise.all([
      db.user.count(),
      db.user.groupBy({ by: ["role"], _count: { _all: true } }),
      db.refreshToken.count({
        where: { revokedAt: null, expiresAt: { gt: new Date() } },
      }),
      db.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { user: { select: { name: true } } },
      }),
      db.page.count({ where: { workflowStage: "TESTING" } }),
      db.page.count({ where: { workflowStage: "APPROVAL" } }),
      db.bugReport.count({ where: { status: "OPEN" } }),
    ]);

  const roleCounts = Object.fromEntries(
    byRole.map((r) => [r.role, r._count._all]),
  ) as Partial<Record<Role, number>>;

  const stats = [
    { label: "Team members", value: totalUsers },
    { label: "Active sessions", value: activeSessions },
    { label: "Pages in testing", value: inTesting },
    { label: "Awaiting approval", value: awaitingApproval },
    { label: "Open bugs", value: openBugs },
    { label: "Audit events (total)", value: await db.auditLog.count() },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Welcome back, {user?.name.split(" ")[0]}
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Your site at a glance — leads, content, menus and pricing are all
        managed from here.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
          >
            <p className="font-display text-3xl font-extrabold text-orange-600">
              {s.value}
            </p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="font-display text-sm font-bold">Team by role</h2>
          <ul className="mt-4 space-y-3">
            {(Object.keys(ROLE_LABELS) as Role[]).map((role) => {
              const count = roleCounts[role] ?? 0;
              const pct = totalUsers ? Math.round((count / totalUsers) * 100) : 0;
              return (
                <li key={role}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{ROLE_LABELS[role]}</span>
                    <span className="text-stone-500 dark:text-stone-400">
                      {count}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-stone-100 dark:bg-stone-800">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="font-display text-sm font-bold">Recent activity</h2>
          <ul className="mt-4 space-y-3">
            {recentAudit.length === 0 && (
              <li className="text-sm text-stone-500 dark:text-stone-400">
                No activity recorded yet.
              </li>
            )}
            {recentAudit.map((entry) => (
              <li key={entry.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate">
                  <span className="font-medium">
                    {entry.user?.name ?? "System"}
                  </span>{" "}
                  <span className="text-stone-500 dark:text-stone-400">
                    {entry.action}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-stone-400">
                  {entry.createdAt.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
