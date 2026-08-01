import { redirect } from "next/navigation";
import { userCan } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import OtpSettings from "@/components/admin/OtpSettings";

export const metadata = { title: "Lead verification" };

export default async function VerificationPage() {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "settings.manage")) redirect("/admin");

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Lead verification</h1>
      <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
        Ask visitors to confirm their email or phone with a one-time code before an enquiry counts as verified. Leads are
        always captured — verification only adds a badge and a score boost. Secrets stay in the server environment.
      </p>
      <div className="mt-6">
        <OtpSettings />
      </div>
    </div>
  );
}
