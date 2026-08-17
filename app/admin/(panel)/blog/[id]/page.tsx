import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { userCan } from "@/lib/auth/rbac";
import BlogEditor from "@/components/admin/BlogEditor";

export const metadata = { title: "Edit article" };

export default async function AdminBlogEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "blog.manage")) redirect("/admin");

  const { id } = await params;
  const post = await db.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <BlogEditor
      post={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        body: post.body,
        category: post.category,
        tags: post.tags,
        coverUrl: post.coverUrl,
        coverWidth: post.coverWidth,
        coverHeight: post.coverHeight,
        status: post.status,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        noIndex: post.noIndex,
        readingMinutes: post.readingMinutes,
      }}
      canPublish={userCan(user, "blog.publish")}
    />
  );
}
