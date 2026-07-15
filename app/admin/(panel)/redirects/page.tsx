import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import RedirectsManager from "@/components/admin/RedirectsManager";

export const metadata = { title: "Redirects" };

export default async function AdminRedirectsPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "redirects.manage")) redirect("/admin");

  const redirects = await db.redirect.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Redirects
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Redirect retired URLs to their replacements. Applies to top-level
        paths (e.g. /old-page) that don&apos;t match an existing page.
      </p>
      <div className="mt-6">
        <RedirectsManager
          redirects={redirects.map((r) => ({
            id: r.id,
            fromPath: r.fromPath,
            toPath: r.toPath,
            permanent: r.permanent,
            isActive: r.isActive,
            hits: r.hits,
          }))}
        />
      </div>
    </div>
  );
}
