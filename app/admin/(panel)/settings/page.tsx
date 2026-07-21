import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import AdminSection from "@/components/admin/AdminSection";
import BotNudgeManager from "@/components/admin/BotNudgeManager";
import FooterInfoManager from "@/components/admin/FooterInfoManager";
import PaymentGatewayManager from "@/components/admin/PaymentGatewayManager";
import SocialLinksManager from "@/components/admin/SocialLinksManager";
import { getBotNudge } from "@/lib/bot-nudge";
import { DEFAULT_FOOTER_INFO } from "@/lib/footer";
import { getPayments, maskPayments } from "@/lib/payments";

export const metadata = { title: "Settings" };

type SocialLink = { key: string; label: string; followers?: string; url: string };

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "settings.manage")) redirect("/admin");

  const [social, footer, botNudge, payments] = await Promise.all([
    db.siteSetting.findUnique({ where: { key: "socialLinks" } }),
    db.siteSetting.findUnique({ where: { key: "footerInfo" } }),
    getBotNudge(),
    getPayments(),
  ]);
  const paymentsView = maskPayments(payments);
  const liveGateways = [
    payments.cashfree.enabled ? `Cashfree ${payments.cashfree.mode}` : null,
    payments.paypal.enabled ? `PayPal ${payments.paypal.mode}` : null,
  ].filter(Boolean);
  const links = Array.isArray(social?.value) ? (social.value as SocialLink[]) : [];
  const footerInfo = { ...DEFAULT_FOOTER_INFO, ...(footer?.value as object | undefined) };

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Site settings</h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Open a section to edit it — every change goes live immediately.
      </p>

      <div className="mt-6 space-y-3">
        <AdminSection
          title="DigiSutra Bot greeting"
          chip={
            botNudge.enabled
              ? `On · ${botNudge.delaySeconds}s / ${botNudge.scrollPercent}% · ${botNudge.rules.length} messages`
              : "Off"
          }
          hint="The bubble that appears beside the chat button for new visitors. It shows once per visitor per week and never on the contact page."
          defaultOpen
        >
          <BotNudgeManager initial={botNudge} />
        </AdminSection>

        <AdminSection
          title="Payment methods"
          chip={liveGateways.length > 0 ? liveGateways.join(" · ") : "Gateways off"}
          hint="Which payment methods the /payment page advertises, and the gateway credentials. Test/Live switches the keys a future checkout will use."
        >
          <PaymentGatewayManager initial={paymentsView} />
        </AdminSection>

        <AdminSection
          title="Footer & contact"
          chip={footerInfo.email}
          hint="The footer's brand text, address, phone numbers and email. Link columns and the legal bar are managed under Menus."
        >
          <FooterInfoManager initial={footerInfo} />
        </AdminSection>

        <AdminSection
          title="Social profiles"
          chip={links.length > 0 ? `${links.length} profiles` : "Using built-in defaults"}
          hint="Power the footer's social icons and the blog's Follow the journal card. With the list empty, the footer falls back to the built-in profiles."
        >
          <SocialLinksManager initial={links} />
        </AdminSection>
      </div>
    </div>
  );
}
