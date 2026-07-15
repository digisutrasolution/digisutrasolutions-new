import type { MetadataRoute } from "next";
import { BLOG_CATEGORIES } from "@/lib/blog";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL;

  const [pages, posts] = await Promise.all([
    db.page
      .findMany({
        where: { status: "PUBLISHED", noIndex: false },
        select: { slug: true, updatedAt: true },
      })
      .catch(() => []),
    db.blogPost
      .findMany({
        where: { status: "PUBLISHED", noIndex: false },
        select: { slug: true, updatedAt: true },
      })
      .catch(() => []),
  ]);

  return [
    { url: base, lastModified: new Date(), priority: 1 },
    { url: `${base}/work`, lastModified: new Date(), priority: 0.8 },
    { url: `${base}/blog`, lastModified: new Date(), priority: 0.8 },
    ...BLOG_CATEGORIES.map((c) => ({
      url: `${base}/blog/category/${c.slug}`,
      lastModified: new Date(),
      priority: 0.7,
    })),
    ...pages.map((p) => ({
      url: `${base}/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.7,
    })),
    ...posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.6,
    })),
  ];
}
