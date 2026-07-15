import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import BlogList from "@/components/admin/BlogList";

export const metadata = { title: "Blog" };

export default async function AdminBlogPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "blog.manage")) redirect("/admin");

  const posts = await db.blogPost.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      authorName: true,
    },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Blog
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Write, edit and publish articles.
      </p>
      <div className="mt-6">
        <BlogList
          posts={posts.map((p) => ({
            ...p,
            publishedAt: p.publishedAt?.toISOString() ?? null,
            updatedAt: p.updatedAt.toISOString(),
          }))}
          canPublish={can(user.role, "blog.publish")}
        />
      </div>
    </div>
  );
}
