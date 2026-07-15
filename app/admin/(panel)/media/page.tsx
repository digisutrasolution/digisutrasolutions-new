import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import MediaManager from "@/components/admin/MediaManager";

export const metadata = { title: "Media" };

export default async function AdminMediaPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "pages.view")) redirect("/admin");

  const assets = await db.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Media library
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Uploads are optimized to WebP automatically. Always set ALT text.
      </p>
      <div className="mt-6">
        <MediaManager
          assets={assets.map((a) => ({
            id: a.id,
            url: a.url,
            alt: a.alt,
            originalName: a.originalName,
            mimeType: a.mimeType,
            size: a.size,
            width: a.width,
            height: a.height,
            uploadedByName: a.uploadedByName,
            createdAt: a.createdAt.toISOString(),
          }))}
          canUpload={can(user.role, "media.upload")}
        />
      </div>
    </div>
  );
}
