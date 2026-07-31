import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import CommTemplates from "@/components/admin/CommTemplates";

export const metadata = { title: "Message templates" };

export default async function CommsPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "comms.manage")) redirect("/admin");

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Message templates</h1>
      <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
        Reusable email and WhatsApp templates for the sales team. Use{" "}
        <code className="rounded bg-stone-100 px-1 dark:bg-stone-800">{"{{name}}"}</code>-style
        placeholders; they&apos;re filled in from the lead when a message is sent.
      </p>
      <div className="mt-6">
        <CommTemplates />
      </div>
    </div>
  );
}
