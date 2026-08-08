import { redirect } from "next/navigation";
import { userCan } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getContactConfig } from "@/lib/contact-config-server";
import { DEFAULT_FOOTER_INFO } from "@/lib/footer";
import ContactAndFooter from "@/components/admin/ContactAndFooter";

export const metadata = { title: "Contact & footer" };

/* The contact page copy and the footer's details.
   These used to be two tabs inside Site settings, behind settings.manage —
   super admin only — so nobody else could correct a phone number or a
   heading, even though both are plain editorial content sitting next to SMTP
   and payment credentials. They now live under Content on their own
   contact.manage permission, and share one screen because the address, phones,
   WhatsApp and email genuinely exist in both records. */

export default async function AdminContactPage() {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "contact.manage")) redirect("/admin");

  const [contact, footer] = await Promise.all([
    getContactConfig(),
    db.siteSetting.findUnique({ where: { key: "footerInfo" } }),
  ]);
  const footerInfo = { ...DEFAULT_FOOTER_INFO, ...(footer?.value as object | undefined) };

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Contact &amp; footer
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        What visitors read on the contact page and in the footer. Every change
        goes live immediately.
      </p>

      <div className="mt-6">
        <ContactAndFooter contact={contact} footerInfo={footerInfo} />
      </div>
    </div>
  );
}
