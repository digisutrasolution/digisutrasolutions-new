import { redirect } from "next/navigation";
import { userCan } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import AiSettings from "@/components/admin/AiSettings";

export const metadata = { title: "AI providers" };

export default async function AiSettingsPage() {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "settings.manage")) redirect("/admin");

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">AI providers</h1>
      <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
        Order the fallback chain, enable or disable a provider, pick its model,
        and test it live. API keys stay in the server environment — this only
        controls behaviour, never secrets.
      </p>
      <div className="mt-6">
        <AiSettings />
      </div>
    </div>
  );
}
