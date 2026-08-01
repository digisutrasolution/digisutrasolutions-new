import { redirect } from "next/navigation";
import { userCan } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import ChannelsSettings from "@/components/admin/ChannelsSettings";

export const metadata = { title: "Contact channels" };

export default async function ChannelsPage() {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "settings.manage")) redirect("/admin");

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Contact channels</h1>
      <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
        Reach leads beyond email and WhatsApp. SMS sends through your own gateway (the one set up for OTP); Telegram adds
        lead-facing deep links plus optional team alerts. Secrets stay in the server environment.
      </p>
      <div className="mt-6">
        <ChannelsSettings />
      </div>
    </div>
  );
}
