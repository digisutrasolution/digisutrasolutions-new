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
  // Libraries the section blocks can point at, so the editor offers real
  // records instead of asking anyone to paste ids. Visible-only: a hidden
  // record would never render anyway, so offering it is a trap.
  const byOrder = { orderBy: [{ order: "asc" as const }, { createdAt: "asc" as const }] };
  const [page, testimonials, logos, caseStudies, pricing] = await Promise.all([
    db.page.findUnique({ where: { id } }),
    db.testimonial.findMany({ where: { visible: true }, select: { id: true, name: true, role: true }, ...byOrder }),
    db.clientLogo.findMany({ where: { visible: true }, select: { id: true, name: true }, ...byOrder }),
    db.caseStudy.findMany({ where: { visible: true }, select: { id: true, client: true, title: true }, ...byOrder }),
    db.pricingPlan.findMany({ where: { visible: true }, select: { id: true, name: true, price: true }, ...byOrder }),
  ]);
  if (!page) notFound();

  const library = {
    testimonials: testimonials.map((t) => ({ id: t.id, label: t.name, sub: t.role })),
    logos: logos.map((c) => ({ id: c.id, label: c.name })),
    caseStudies: caseStudies.map((c) => ({ id: c.id, label: c.client, sub: c.title })),
    pricing: pricing.map((p) => ({ id: p.id, label: p.name, sub: p.price })),
  };

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
      library={library}
    />
  );
}
