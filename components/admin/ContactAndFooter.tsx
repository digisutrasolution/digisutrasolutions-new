"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import ContactManager from "@/components/admin/ContactManager";
import FooterInfoManager from "@/components/admin/FooterInfoManager";
import type { ContactConfig } from "@/lib/contact-config";
import type { FooterInfo } from "@/lib/footer";

/* Two tabs on one screen, because the contact page and the footer are the
   same subject to whoever is editing them. They are still two separate
   records, and the shared details (address, phones, WhatsApp, email) live in
   BOTH — so the banner below warns when they have drifted apart rather than
   letting someone update one and ship a stale number in the other. Merging
   the two records into a single source is the follow-up; this surfaces the
   problem without a data migration. */

type Tab = "contact" | "footer";

const TABS: { key: Tab; label: string; hint: string }[] = [
  {
    key: "contact",
    label: "Contact page",
    hint: "The /contact page — heading, promises, address, hours, WhatsApp, the enquiry desks (and the inbox each routes to) and SEO.",
  },
  {
    key: "footer",
    label: "Footer",
    hint: "The footer's brand text, address, phone numbers and email. Link columns and the legal bar are managed under Menus.",
  },
];

/** Compare loosely — punctuation and spacing differ between the two records
    by design, so only flag a difference in the digits/letters that matter. */
const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");

export default function ContactAndFooter({
  contact,
  footerInfo,
}: {
  contact: ContactConfig;
  footerInfo: FooterInfo;
}) {
  const [tab, setTab] = useState<Tab>("contact");
  const active = TABS.find((t) => t.key === tab);

  const pairs: { field: string; a: string; b: string }[] = [
    { field: "Email", a: contact.mainEmail, b: footerInfo.email },
    { field: "India phone", a: contact.mainPhone, b: footerInfo.phoneIndia },
    { field: "USA phone", a: contact.usaTollFree, b: footerInfo.phoneUs },
    { field: "WhatsApp", a: contact.whatsappDisplay, b: footerInfo.whatsapp },
  ];
  // Only compare when both sides are filled — a blank optional field is not drift.
  const drift = pairs.filter((p) => p.a && p.b && norm(p.a) !== norm(p.b));

  return (
    <div>
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
          </button>
        ))}
      </div>

      {drift.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-amber-800 dark:text-amber-200">
            <TriangleAlert size={14} aria-hidden />
            The two tabs disagree
          </p>
          <p className="mt-1.5 text-xs text-amber-900/80 dark:text-amber-200/80">
            These details are stored separately on each tab, so the site is
            currently showing different values in different places. Update both.
          </p>
          <ul className="mt-2.5 space-y-1">
            {drift.map((d) => (
              <li key={d.field} className="text-xs text-stone-700 dark:text-stone-300">
                <span className="font-semibold">{d.field}</span> — contact page:{" "}
                <span className="font-mono">{d.a}</span> · footer:{" "}
                <span className="font-mono">{d.b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {active && (
        <p className="mb-4 text-sm text-stone-500 dark:text-stone-400">{active.hint}</p>
      )}

      {tab === "contact" && <ContactManager contact={contact} />}
      {tab === "footer" && <FooterInfoManager initial={footerInfo} />}
    </div>
  );
}
