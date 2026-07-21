import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getPageBySlug, isLive, promoteDueScheduledPage } from "@/lib/cms/pages";
import { parseSections } from "@/lib/cms/sections";
import { embedUrl } from "@/lib/cms/videos";
import SectionRenderer from "@/components/sections/SectionRenderer";

export const dynamic = "force-dynamic";

import { absUrl, SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug: slugParts } = await params;
  const slug = slugParts.join("/");
  const page = await getPageBySlug(slug);
  if (!page || !isLive(page)) return {};
  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? undefined,
    alternates: {
      canonical: page.canonicalUrl ?? `${SITE_URL}/${page.slug}`,
    },
    robots: page.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: page.seoTitle ?? page.title,
      description: page.seoDescription ?? undefined,
      url: `${SITE_URL}/${page.slug}`,
      type: "website",
      ...(page.ogImage ? { images: [{ url: absUrl(page.ogImage) }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: page.seoTitle ?? page.title,
      description: page.seoDescription ?? undefined,
    },
  };
}

export default async function CmsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug: slugParts } = await params;
  const slug = slugParts.join("/");
  const { preview } = await searchParams;

  let page = await getPageBySlug(slug);
  if (!page) {
    // Redirects manager: unmatched paths resolve here before 404.
    const rule = await db.redirect.findUnique({ where: { fromPath: `/${slug}` } });
    if (rule?.isActive) {
      db.redirect
        .update({ where: { id: rule.id }, data: { hits: { increment: 1 } } })
        .catch(() => {});
      if (rule.permanent) permanentRedirect(rule.toPath);
      redirect(rule.toPath);
    }
    notFound();
  }

  page = await promoteDueScheduledPage(page);

  if (!isLive(page)) {
    // Drafts are visible only to signed-in team members with ?preview=1.
    const user = preview === "1" ? await getCurrentUser() : null;
    if (!user) notFound();
  }

  const sections = parseSections(page.sections);

  const faqItems = sections
    .filter((s) => s.type === "faq")
    .flatMap((s) => (s.type === "faq" ? s.items : []))
    .filter((i) => i.q && i.a);

  // Nested slugs get their live parent page as an intermediate crumb.
  const crumbs: { name: string; item: string }[] = [
    { name: "Home", item: SITE_URL },
  ];
  if (slugParts.length > 1) {
    const parent = await getPageBySlug(slugParts.slice(0, -1).join("/"));
    if (parent && isLive(parent)) {
      crumbs.push({ name: parent.title, item: `${SITE_URL}/${parent.slug}` });
    }
  }
  crumbs.push({ name: page.title, item: `${SITE_URL}/${page.slug}` });

  const jsonLd: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        item: c.item,
      })),
    },
  ];
  if (faqItems.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((i) => ({
        "@type": "Question",
        name: i.q,
        acceptedAnswer: { "@type": "Answer", text: i.a },
      })),
    });
  }
  if (page.schemaJson && typeof page.schemaJson === "object") {
    jsonLd.push(page.schemaJson as object);
  }

  // VideoObject schema for embedded library videos.
  const videoSlugs = sections
    .filter((s) => s.type === "video")
    .map((s) => (s.type === "video" ? s.videoSlug : ""))
    .filter(Boolean);
  if (videoSlugs.length > 0) {
    const videos = await db.video.findMany({
      where: { slug: { in: videoSlugs } },
    });
    for (const v of videos) {
      jsonLd.push({
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: v.title,
        description: v.description || v.title,
        uploadDate: v.createdAt.toISOString(),
        ...(v.thumbnailUrl ? { thumbnailUrl: v.thumbnailUrl } : {}),
        ...(v.durationSec ? { duration: `PT${v.durationSec}S` } : {}),
        embedUrl: embedUrl(v.provider, v.videoId),
      });
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {!isLive(page) && (
        <div className="fixed inset-x-0 top-0 z-[60] bg-amber-400 py-1.5 text-center text-xs font-semibold text-amber-950">
          Draft preview — this page is not publicly visible
        </div>
      )}
      <SectionRenderer sections={sections} />
      {/* Bottom-padding floor so every CMS page ends with breathing room
          regardless of which block type it ends on */}
      <div className="pb-16 sm:pb-20" />
    </>
  );
}
