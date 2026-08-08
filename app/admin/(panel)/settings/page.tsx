import { redirect } from "next/navigation";
import { userCan } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import SettingsTabs from "@/components/admin/SettingsTabs";
import { getAnalytics } from "@/lib/analytics";
import { getBotNudge } from "@/lib/bot-nudge";
import { getPayments, maskPayments } from "@/lib/payments";
import { getSmtp, maskSmtp } from "@/lib/smtp";

export const metadata = { title: "Settings" };

type SocialLink = { key: string; label: string; followers?: string; url: string };

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "settings.manage")) redirect("/admin");

  const [social, botNudge, payments, analytics, smtp] = await Promise.all([
    db.siteSetting.findUnique({ where: { key: "socialLinks" } }),
    getBotNudge(),
    getPayments(),
    getAnalytics(),
    getSmtp(),
  ]);
  const paymentsView = maskPayments(payments);
  const links = Array.isArray(social?.value) ? (social.value as SocialLink[]) : [];

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Site settings</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Pick a section to edit it — every change goes live immediately.
      </p>

      <SettingsTabs
        analytics={analytics}
        botNudge={botNudge}
        links={links}
        payments={paymentsView}
        smtp={maskSmtp(smtp)}
      />
    </div>
  );
}
