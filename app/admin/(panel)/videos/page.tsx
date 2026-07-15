import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import VideosManager from "@/components/admin/VideosManager";

export const metadata = { title: "Videos" };

export default async function AdminVideosPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "pages.view")) redirect("/admin");

  const videos = await db.video.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Videos
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Paste YouTube/Vimeo links or direct files. Featured videos appear on
        the home page; embed any video on a page with a “Video” section.
      </p>
      <div className="mt-6">
        <VideosManager
          videos={videos.map((v) => ({
            id: v.id,
            title: v.title,
            slug: v.slug,
            provider: v.provider,
            videoId: v.videoId,
            description: v.description,
            category: v.category,
            thumbnailUrl: v.thumbnailUrl,
            featured: v.featured,
            createdAt: v.createdAt.toISOString(),
          }))}
          canManage={can(user.role, "videos.manage")}
        />
      </div>
    </div>
  );
}
