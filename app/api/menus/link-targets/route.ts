import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";

/* Real destinations the admin can pick from instead of typing a URL by
   hand — published pages, live service categories and published posts,
   plus the app's fixed routes. Powers the link picker in Admin → Menus. */

const STATIC_ROUTES = [
  { label: "Home", href: "/" },
  { label: "Services index", href: "/services" },
  { label: "Pricing", href: "/pricing" },
  { label: "Payment options", href: "/payment" },
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Work", href: "/work" },
  { label: "Blog", href: "/blog" },
  { label: "Search", href: "/search" },
  { label: "Free audit (home anchor)", href: "/#audit" },
];

export async function GET() {
  const { error } = await requirePermission("menus.manage");
  if (error) return error;

  const [pages, services, posts] = await Promise.all([
    db.page
      .findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, title: true },
        orderBy: { slug: "asc" },
        take: 300,
      })
      .catch(() => []),
    db.serviceCategory
      .findMany({
        where: { visible: true },
        select: { slug: true, name: true },
        orderBy: { order: "asc" },
        take: 100,
      })
      .catch(() => []),
    db.blogPost
      .findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, title: true },
        orderBy: { publishedAt: "desc" },
        take: 100,
      })
      .catch(() => []),
  ]);

  return NextResponse.json({
    ok: true,
    groups: [
      { label: "Site", items: STATIC_ROUTES },
      {
        label: "Services",
        items: services.map((s) => ({ label: s.name, href: `/services/${s.slug}` })),
      },
      {
        label: "Pages",
        items: pages.map((p) => ({ label: p.title, href: `/${p.slug}` })),
      },
      {
        label: "Blog posts",
        items: posts.map((p) => ({ label: p.title, href: `/blog/${p.slug}` })),
      },
    ],
  });
}
