import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import FaqManager from "@/components/admin/FaqManager";

export const metadata = { title: "FAQ" };

export default async function AdminFaqPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "faq.manage")) redirect("/admin");

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">FAQ</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Questions power the /faq page (grouped by category) and the home FAQ
        section (items marked &ldquo;Show on home page&rdquo;). Write the lead as the
        one-line answer a search engine could quote verbatim.
      </p>
      <div className="mt-6">
        <FaqManager />
      </div>
    </div>
  );
}
