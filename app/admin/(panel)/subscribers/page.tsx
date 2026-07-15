import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import SubscribersManager from "@/components/admin/SubscribersManager";

export const metadata = { title: "Subscribers" };

export default async function AdminSubscribersPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "newsletter.manage")) redirect("/admin");

  const subscribers = await db.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Newsletter subscribers
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Emails collected from the blog signup cards. Export as CSV to import
        into your email tool.
      </p>
      <div className="mt-6">
        <SubscribersManager
          subscribers={subscribers.map((s) => ({
            id: s.id,
            email: s.email,
            source: s.source,
            createdAt: s.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
