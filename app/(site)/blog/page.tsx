import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bot, ChevronDown, Megaphone, Newspaper, Search } from "lucide-react";
import AdSlot from "@/components/blog/AdSlot";
import NewsletterCard from "@/components/blog/NewsletterCard";
import SocialFollow from "@/components/blog/SocialFollow";
import { db } from "@/lib/db";
import { BLOG_CATEGORIES, categoryByDb } from "@/lib/blog";

export const dynamic = "force-dynamic";

const SITE_URL = "https://digisutra-alpha.vercel.app";
const PAGE_SIZE = 10;

export const metadata: Metadata = {
  title: "Digital Marketing Blog: SEO, Ads, WhatsApp & AI Playbooks",
  description:
    "Growth playbooks for startups and SMBs — SEO and AI search, PPC, WhatsApp marketing, lead generation and AI automation. From DigiSutra Solutions, Noida.",
  alternates: {
    canonical: `${SITE_URL}/blog`,
    types: { "application/rss+xml": `${SITE_URL}/blog/rss.xml` },
  },
};

const HUB_ICONS = { seo: Search, marketing: Megaphone, ai: Bot } as const;

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [posts, counts, views] = await Promise.all([
    db.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE + 1,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        coverUrl: true,
        publishedAt: true,
        readingMinutes: true,
      },
    }),
    db.blogPost.groupBy({
      by: ["category"],
      where: { status: "PUBLISHED" },
      _count: { _all: true },
    }),
    db.pageView
      .groupBy({
        by: ["path"],
        where: { path: { startsWith: "/blog/" } },
        _count: { _all: true },
        orderBy: { _count: { path: "desc" } },
        take: 8,
      })
      .catch(() => []),
  ]);

  const hasMore = posts.length > PAGE_SIZE;
  const pagePosts = posts.slice(0, PAGE_SIZE);
  const countFor = (dbName: string) =>
    counts.find((c) => c.category === dbName)?._count._all ?? 0;

  // Most read: real pageview counts, falling back to latest posts.
  const viewedSlugs = views
    .map((v) => v.path.replace(/^\/blog\//, ""))
    .filter((s) => s && !s.includes("/"));
  const mostReadDb =
    viewedSlugs.length > 0
      ? await db.blogPost.findMany({
          where: { status: "PUBLISHED", slug: { in: viewedSlugs.slice(0, 6) } },
          select: { slug: true, title: true },
        })
      : [];
  const mostRead =
    mostReadDb.length >= 3
      ? viewedSlugs
          .map((s) => mostReadDb.find((p) => p.slug === s))
          .filter((p): p is NonNullable<typeof p> => Boolean(p))
          .slice(0, 3)
      : pagePosts.slice(0, 3).map((p) => ({ slug: p.slug, title: p.title }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Journal", item: `${SITE_URL}/blog` },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: pagePosts.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: p.title,
          url: `${SITE_URL}/blog/${p.slug}`,
        })),
      },
    ],
  };

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
          Journal
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
          Pick your{" "}
          <span className="font-serif-accent font-medium italic text-orange-600">
            growth lane
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-stone-500 sm:text-base">
          SEO, PPC, WhatsApp and AI automation playbooks for startups and SMBs
          — practical, budget-aware and fluff-free.
        </p>
      </div>

      {/* Topic hubs */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {BLOG_CATEGORIES.map((cat, i) => {
          const Icon = HUB_ICONS[cat.slug as keyof typeof HUB_ICONS] ?? Newspaper;
          const n = countFor(cat.db);
          const dark = i === 0;
          return (
            <Link
              key={cat.slug}
              href={`/blog/category/${cat.slug}`}
              className={`group rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
                dark
                  ? "border-stone-900 bg-stone-900 hover:shadow-[0_20px_44px_rgba(28,25,23,0.3)]"
                  : "border-stone-200 bg-white hover:border-[#F26419] hover:shadow-[0_20px_44px_rgba(124,45,18,0.1)]"
              }`}
            >
              <Icon
                size={22}
                aria-hidden
                className={dark ? "text-[#FDBA74]" : "text-[#F26419]"}
              />
              <h2
                className={`font-display mt-4 text-lg font-bold ${
                  dark ? "text-white" : "text-stone-900"
                }`}
              >
                {cat.label}
              </h2>
              <p
                className={`mt-1.5 text-sm leading-relaxed ${
                  dark ? "text-stone-400" : "text-stone-500"
                }`}
              >
                {cat.blurb}
              </p>
              <p
                className={`mt-4 flex items-center gap-1.5 text-sm font-semibold ${
                  dark ? "text-[#FDBA74]" : "text-orange-700"
                }`}
              >
                {n} {n === 1 ? "guide" : "guides"}
                <ArrowRight
                  size={14}
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        {/* Latest */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-800">
            Latest
          </p>
          <div className="mt-4 divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
            {pagePosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex items-center gap-4 p-4 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-[#FFF7F0]"
              >
                <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-stone-900">
                  {post.coverUrl ? (
                    <Image
                      src={post.coverUrl}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-900 via-orange-600 to-amber-400">
                      <Newspaper size={16} className="text-white/80" aria-hidden />
                    </span>
                  )}
                  <span
                    className="absolute inset-0 bg-[#F26419]/25 mix-blend-color"
                    aria-hidden
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs text-stone-400">
                    {categoryByDb(post.category)?.label ?? post.category} ·{" "}
                    {post.publishedAt?.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {post.readingMinutes} min read
                  </span>
                  <span className="font-display mt-1 block font-bold leading-snug text-stone-900 transition-colors group-hover:text-orange-700">
                    {post.title}
                  </span>
                  {post.excerpt && (
                    <span className="mt-1 hidden text-sm leading-relaxed text-stone-500 sm:line-clamp-1">
                      {post.excerpt}
                    </span>
                  )}
                </span>
              </Link>
            ))}
            {pagePosts.length === 0 && (
              <p className="p-10 text-center text-sm text-stone-500">
                No articles published yet — check back soon.
              </p>
            )}
          </div>
          {(hasMore || page > 1) && (
            <div className="mt-5 flex items-center justify-center gap-6 text-sm font-semibold">
              {page > 1 && (
                <Link
                  href={`/blog?page=${page - 1}`}
                  className="text-stone-600 hover:text-orange-700"
                >
                  ← Newer posts
                </Link>
              )}
              {hasMore && (
                <Link
                  href={`/blog?page=${page + 1}`}
                  className="flex items-center gap-1 text-orange-700 hover:text-orange-800"
                >
                  Older posts <ChevronDown size={14} aria-hidden />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Most read + audit CTA */}
        <aside>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-800">
            Most read
          </p>
          <ol className="mt-4 space-y-1">
            {mostRead.map((p, i) => (
              <li key={p.slug}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="group flex items-baseline gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[#FFF7F0]"
                >
                  <span className="font-serif-accent text-lg italic text-[#F26419]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-semibold leading-snug text-stone-700 transition-colors group-hover:text-orange-700">
                    {p.title}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <div className="mt-6 rounded-2xl bg-[#FFF6EF] p-5">
            <p className="font-display text-sm font-bold text-orange-950">
              Free 15-page website audit
            </p>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">
              See exactly what is blocking your rankings and conversions —
              delivered in 48 hours.
            </p>
            <Link
              href="/#audit"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#F26419] hover:text-orange-800"
            >
              Get my audit <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
          <div className="mt-6 empty:hidden">
            <AdSlot placement="BLOG_SIDEBAR" />
          </div>
          <div className="mt-6 empty:hidden">
            <SocialFollow />
          </div>
          <div className="mt-6">
            <NewsletterCard source="blog-index" />
          </div>
        </aside>
      </div>
    </section>
  );
}
