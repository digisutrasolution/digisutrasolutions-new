import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import PricingManager from "@/components/admin/PricingManager";

export const metadata = { title: "Pricing" };

export default async function AdminPricingPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "pricing.manage")) redirect("/admin");

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Pricing
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Plans, the comparison matrix and the rate card on /pricing. Market
        notes came from live 2026 India rate research — update them as the
        market moves.
      </p>
      <div className="mt-6">
        <PricingManager />
      </div>
    </div>
  );
}
