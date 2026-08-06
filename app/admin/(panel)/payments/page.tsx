import { redirect } from "next/navigation";
import { userCan } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import PaymentsList from "@/components/admin/PaymentsList";

export const metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "payments.manage")) redirect("/admin");

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Payments</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        A ledger of money received against leads and quotations. Records are
        entered by the team as payments land — gateway checkout is a later
        phase and will write the same rows.
      </p>
      <div className="mt-6">
        <PaymentsList />
      </div>
    </div>
  );
}
