import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { parseFormFields } from "@/lib/cms/forms";
import FormsManager from "@/components/admin/FormsManager";

export const metadata = { title: "Forms" };

export default async function AdminFormsPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "forms.manage")) redirect("/admin");

  const forms = await db.form.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { submissions: true } } },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Forms
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Build forms, embed them on pages with a “Form” section, and export
        submissions.
      </p>
      <div className="mt-6">
        <FormsManager
          forms={forms.map((f) => ({
            id: f.id,
            name: f.name,
            slug: f.slug,
            fields: parseFormFields(f.fields),
            notifyEmail: f.notifyEmail,
            isActive: f.isActive,
            submissionCount: f._count.submissions,
          }))}
        />
      </div>
    </div>
  );
}
