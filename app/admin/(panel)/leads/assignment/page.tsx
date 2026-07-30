import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import AssignmentRules from "@/components/admin/AssignmentRules";

export const metadata = { title: "Assignment rules" };

export default async function AssignmentRulesPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "leads.manage")) redirect("/admin");

  const [rules, assignees] = await Promise.all([
    db.assignmentRule.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
    db.user.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const serialized = rules.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Assignment rules
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
        Route every new enquiry to the right person automatically. Rules run
        top-to-bottom; the first one whose conditions all match claims the lead
        and hands it to the next teammate in its pool (round-robin). Leave a
        condition empty to match anything.
      </p>
      <div className="mt-6">
        <AssignmentRules initialRules={serialized} assignees={assignees} />
      </div>
    </div>
  );
}
