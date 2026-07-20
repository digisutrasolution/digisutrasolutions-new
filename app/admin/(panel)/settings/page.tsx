import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import FooterInfoManager from "@/components/admin/FooterInfoManager";
import SocialLinksManager from "@/components/admin/SocialLinksManager";
import { DEFAULT_FOOTER_INFO } from "@/lib/footer";

export const metadata = { title: "Settings" };

type SocialLink = { key: string; label: string; followers?: string; url: string };

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "settings.manage")) redirect("/admin");

  const [social, footer] = await Promise.all([
    db.siteSetting.findUnique({ where: { key: "socialLinks" } }),
    db.siteSetting.findUnique({ where: { key: "footerInfo" } }),
  ]);
  const links = Array.isArray(social?.value) ? (social.value as SocialLink[]) : [];
  const footerInfo = { ...DEFAULT_FOOTER_INFO, ...(footer?.value as object | undefined) };

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Site settings
      </h1>

      <h2 className="font-display mt-6 text-base font-bold">Footer &amp; contact</h2>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        The footer&apos;s brand text, address, phone numbers and email. Link
        columns and the legal bar are managed under Menus (Footer / Footer
        legal locations).
      </p>
      <div className="mt-4">
        <FooterInfoManager initial={footerInfo} />
      </div>

      <h2 className="font-display mt-8 text-base font-bold">Social profiles</h2>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Power the footer&apos;s social icons and the blog&apos;s &ldquo;Follow the
        journal&rdquo; card. With the list empty, the footer shows the built-in
        profiles and the blog card hides.
      </p>
      <div className="mt-4">
        <SocialLinksManager initial={links} />
      </div>
    </div>
  );
}
