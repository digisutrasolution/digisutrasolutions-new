import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import PagesList from "@/components/admin/PagesList";

export const metadata = { title: "Pages" };

export default async function AdminPagesPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "pages.view")) redirect("/admin");

  const pages = await db.page.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      workflowStage: true,
      scheduledAt: true,
      updatedAt: true,
      updatedBy: { select: { name: true } },
    },
  });

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
          }))}
          canCreate={can(user.role, "pages.create")}
          canPublish={can(user.role, "pages.publish")}
        />
      </div>
    </div>
  );
}
