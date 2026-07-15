import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import CommentsModeration from "@/components/admin/CommentsModeration";

export const metadata = { title: "Comments" };

export default async function AdminCommentsPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "comments.moderate")) redirect("/admin");

  const [comments, counts] = await Promise.all([
    db.blogComment.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { post: { select: { title: true, slug: true } } },
    }),
    db.blogComment.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Reader reviews
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Blog comments and ratings. Only approved reviews appear on the site;
        approved star ratings feed the article&apos;s rich-result schema.
      </p>
      <div className="mt-6">
        <CommentsModeration
          comments={comments.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            body: c.body,
            rating: c.rating,
            status: c.status,
            reply: c.reply,
            createdAt: c.createdAt.toISOString(),
            postTitle: c.post.title,
            postSlug: c.post.slug,
          }))}
          counts={Object.fromEntries(counts.map((c) => [c.status, c._count._all]))}
        />
      </div>
    </div>
  );
}
