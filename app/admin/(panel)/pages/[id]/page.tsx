import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { userCan } from "@/lib/auth/rbac";
import { parseSections } from "@/lib/cms/sections";
import PageEditor from "@/components/admin/PageEditor";

export const metadata = { title: "Edit page" };

export default async function AdminPageEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "pages.view")) redirect("/admin");

  const { id } = await params;
  const page = await db.page.findUnique({ where: { id } });
  if (!page) notFound();

  return (
    <PageEditor
      page={{
        id: page.id,
        title: page.title,
        slug: page.slug,
        status: page.status,
        workflowStage: page.workflowStage,
        sections: parseSections(page.sections),
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        canonicalUrl: page.canonicalUrl,
        ogImage: page.ogImage,
        noIndex: page.noIndex,
        scheduledAt: page.scheduledAt?.toISOString() ?? null,
        publishedAt: page.publishedAt?.toISOString() ?? null,
      }}
      permissions={{
        edit: userCan(user, "pages.edit"),
        seo: userCan(user, "seo.manage"),
        publish: userCan(user, "pages.publish"),
      }}
    />
  );
}
