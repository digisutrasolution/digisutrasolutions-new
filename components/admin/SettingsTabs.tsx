"use client";

import { useState } from "react";
import AnalyticsManager from "@/components/admin/AnalyticsManager";
import BotNudgeManager from "@/components/admin/BotNudgeManager";
import FooterInfoManager from "@/components/admin/FooterInfoManager";
import PaymentGatewayManager, { type PaymentsView } from "@/components/admin/PaymentGatewayManager";
import SocialLinksManager from "@/components/admin/SocialLinksManager";
import type { AnalyticsSettings } from "@/lib/analytics";
import type { BotNudge } from "@/lib/bot-nudge";
import type { FooterInfo } from "@/lib/footer";

type SocialLink = { key: string; label: string; followers?: string; url: string };

type TabKey = "analytics" | "bot" | "footer" | "social" | "payments";

export default function SettingsTabs({
  analytics,
  botNudge,
  footerInfo,
  links,
  payments,
}: {
  analytics: AnalyticsSettings;
  botNudge: BotNudge;
  footerInfo: FooterInfo;
  links: SocialLink[];
  payments: PaymentsView;
}) {
  const [tab, setTab] = useState<TabKey>("analytics");

  const analyticsChip = analytics.enabled
    ? [
        analytics.ga4Id && "GA4",
        analytics.gtmId && "GTM",
        analytics.metaPixelId && "Meta",
        analytics.clarityId && "Clarity",
      ]
        .filter(Boolean)
        .join(" · ") || "On"
    : "Off";
  const botChip = botNudge.enabled ? "On" : "Off";
  const liveGateways = [
    payments.cashfree.enabled ? `Cashfree ${payments.cashfree.mode}` : null,
    payments.paypal.enabled ? `PayPal ${payments.paypal.mode}` : null,
  ].filter(Boolean);
  const paymentsChip = liveGateways.length > 0 ? liveGateways.join(" · ") : "Off";
  const socialChip = links.length > 0 ? `${links.length}` : "Defaults";

  const TABS: { key: TabKey; label: string; chip: string; hint: string }[] = [
    {
      key: "analytics",
      label: "Analytics & tracking",
      chip: analyticsChip,
      hint: "Google Analytics, Tag Manager, Meta Pixel and Clarity. Nothing loads until you add an ID and switch tracking on.",
    },
    {
      key: "bot",
      label: "Bot greeting",
      chip: botChip,
      hint: "The bubble that appears beside the chat button for new visitors. It shows once per visitor per week and never on the contact page.",
    },
    {
      key: "footer",
      label: "Footer & contact",
      chip: footerInfo.email,
      hint: "The footer's brand text, address, phone numbers and email. Link columns and the legal bar are managed under Menus.",
    },
    {
      key: "social",
      label: "Social profiles",
      chip: socialChip,
      hint: "Power the footer's social icons and the blog's Follow the journal card. With the list empty, the footer falls back to the built-in profiles.",
    },
    {
      key: "payments",
      label: "Payment methods",
      chip: paymentsChip,
      hint: "Which payment methods the /payment page advertises, and the gateway credentials. Test/Live switches the keys a future checkout will use.",
    },
  ];

  const active = TABS.find((t) => t.key === tab);

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-stone-100 p-1 dark:bg-stone-800 sm:w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.key
                ? "bg-white text-stone-900 shadow-sm dark:bg-stone-950 dark:text-stone-100"
                : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-stone-400">{t.chip}</span>
          </button>
        ))}
      </div>

      {active && (
        <p className="mb-4 text-sm text-stone-500 dark:text-stone-400">{active.hint}</p>
      )}

      {tab === "analytics" && <AnalyticsManager settings={analytics} />}
      {tab === "bot" && <BotNudgeManager initial={botNudge} />}
      {tab === "footer" && <FooterInfoManager initial={footerInfo} />}
      {tab === "social" && <SocialLinksManager initial={links} />}
      {tab === "payments" && <PaymentGatewayManager initial={payments} />}
    </div>
  );
}
