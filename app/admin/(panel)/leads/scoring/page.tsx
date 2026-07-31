import { redirect } from "next/navigation";
import { userCan } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { getScoringConfig } from "@/lib/scoring-server";
import LeadScoring from "@/components/admin/LeadScoring";

export const metadata = { title: "Lead scoring" };

export default async function LeadScoringPage() {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "leads.rules")) redirect("/admin");

  const config = await getScoringConfig(true);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Lead scoring
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
        Every lead earns points from the signals below; the total (capped at
        100) sorts it into Hot, Warm or Cold. New leads are scored the moment
        they arrive. Tune the weights, then recompute existing leads.
      </p>
      <div className="mt-6">
        <LeadScoring initialConfig={config} />
      </div>
    </div>
  );
}
