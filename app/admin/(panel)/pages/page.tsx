import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { userCan } from "@/lib/auth/rbac";
import PagesList from "@/components/admin/PagesList";
import { STATS_WINDOW_DAYS, getPageStats } from "@/lib/cms/page-stats";

export const metadata = { title: "Pages" };

export default async function AdminPagesPage() {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "pages.view")) redirect("/admin");

  const pages = await db.page.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      kind: true,
      variantOfId: true,
      variantWeight: true,
      status: true,
      workflowStage: true,
      scheduledAt: true,
      updatedAt: true,
      updatedBy: { select: { name: true } },
    },
  });

  // Two aggregates for the whole list, not one query per row.
  const stats = await getPageStats(pages);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Pages
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Create, edit and publish site pages built from sections.
      </p>
      <div className="mt-6">
        <PagesList
          pages={pages.map((p) => ({
            ...p,
            scheduledAt: p.scheduledAt?.toISOString() ?? null,
            updatedAt: p.updatedAt.toISOString(),
            updatedByName: p.updatedBy?.name ?? null,
            stats: stats.get(p.id) ?? { views: 0, leads: 0, conversion: null },
          }))}
          statsDays={STATS_WINDOW_DAYS}
          canCreate={userCan(user, "pages.create")}
          canPublish={userCan(user, "pages.publish")}
          canDelete={userCan(user, "pages.delete")}
        />
      </div>
    </div>
  );
}
