import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import SocialLinksManager from "@/components/admin/SocialLinksManager";

export const metadata = { title: "Settings" };

type SocialLink = { key: string; label: string; followers?: string; url: string };

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "settings.manage")) redirect("/admin");

  const setting = await db.siteSetting.findUnique({ where: { key: "socialLinks" } });
  const links = Array.isArray(setting?.value) ? (setting.value as SocialLink[]) : [];

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Site settings
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Social profiles shown in the blog&apos;s &ldquo;Follow the journal&rdquo;
        card. Leave the list empty to hide the card entirely.
      </p>
      <div className="mt-6">
        <SocialLinksManager initial={links} />
      </div>
    </div>
  );
}
