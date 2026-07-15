import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import AdsManager from "@/components/admin/AdsManager";

export const metadata = { title: "Ads" };

export default async function AdminAdsPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "ads.manage")) redirect("/admin");

  const ads = await db.adBanner.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Ad banners
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Sponsor slots on the blog. Banners auto-hide outside their schedule;
        impressions and clicks are tracked per banner.
      </p>
      <div className="mt-6">
        <AdsManager
          ads={ads.map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            imageUrl: a.imageUrl,
            targetUrl: a.targetUrl,
            placement: a.placement,
            active: a.active,
            startsAt: a.startsAt?.toISOString() ?? null,
            endsAt: a.endsAt?.toISOString() ?? null,
            impressions: a.impressions,
            clicks: a.clicks,
          }))}
        />
      </div>
    </div>
  );
}
