import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import AdSlot from "@/components/blog/AdSlot";
import NewsletterCard from "@/components/blog/NewsletterCard";
import Pagination from "@/components/blog/Pagination";
import PostListCard from "@/components/blog/PostListCard";
import SocialFollow from "@/components/blog/SocialFollow";
import { db } from "@/lib/db";
import {
  BLOG_CATEGORIES,
  categoryBySlug,
  categoryKeysFor,
  hubCount,
} from "@/lib/blog";

export const dynamic = "force-dynamic";

import { SITE_URL } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";

const PAGE_SIZE = 9;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = categoryBySlug(category);
  if (!cat) return {};
  return {
    title: `${cat.label} — guides & playbooks`,
    description: cat.intro.split(/(?<=[.!?])\s/).slice(0, 2).join(" "),
    alternates: { canonical: `${SITE_URL}/blog/category/${cat.slug}` },
  };
}

export default async function BlogCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { category } = await params;
  const { page: pageParam } = await searchParams;
  const cat = categoryBySlug(category);
  if (!cat) notFound();

  /* Must match countFor on the index, or the card would advertise a number the
     page then fails to list. Aliases are matched exactly here rather than
     case-insensitively — Prisma has no case-insensitive `in`, and every value
     actually in use is covered by the alias list. */
  const where = {
    status: "PUBLISHED" as const,
    category: { in: categoryKeysFor(cat) },
  };
  const total = await db.blogPost.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(
    Math.max(1, parseInt(pageParam ?? "1", 10) || 1),
    totalPages,
  );

  const [posts, counts, elsewhere] = await Promise.all([
    db.blogPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (current - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        /* PostListCard needs it to resolve the hub label. Hidden on this page
           (every card would say the same thing) but still required by the type. */
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
    /* Onward reading, from OTHER lanes rather than a "most read in this lane":
       a one-post hub would otherwise recommend the very card above it.

       This sits in the main column, not the rail, and that placement is the
       point. A hub holding one post has a short left column; hanging a tall
       sidebar beside it just moves the empty space from the right to the left.
       Extending the main column instead keeps the two roughly level AND gives
       a reader who lands on a thin lane somewhere real to go next. */
    db.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        category: { notIn: categoryKeysFor(cat) },
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
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
  ]);

  const otherLanes = BLOG_CATEGORIES.filter((c) => c.slug !== cat.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Journal", item: `${SITE_URL}/blog` },
          {
            "@type": "ListItem",
            position: 3,
            name: cat.label,
            item: `${SITE_URL}/blog/category/${cat.slug}`,
          },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: posts.map((p, i) => ({
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
        dangerouslySetInnerHTML={jsonLdScript(jsonLd)}
      />
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 transition-colors hover:text-orange-700"
      >
        <ArrowLeft size={14} aria-hidden /> All topics
      </Link>

      {/* Same two-column shell as /blog, and for the same reason the article
          page gives itself rails: a hub is a 1280px container holding one
          narrow column, so the right ~40% was empty on every lane before the
          first post was even counted. The heading sits INSIDE the main column
          (as the article's h1 does) so the rail starts level with it rather
          than below a band of blank space. */}
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
            Journal · {cat.label}
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
            {cat.label.split(" & ")[0]}{" "}
            {cat.label.includes(" & ") && (
              <span className="font-serif-accent font-medium italic text-orange-600">
                &amp; {cat.label.split(" & ")[1]}
              </span>
            )}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-stone-600">
            {cat.intro}
          </p>

          {/* List cards, not a grid. A grid leaves empty tracks whenever the
              post count is not a multiple of the column count, and these lanes
              hold 0, 1, 2 and 6 posts — one card per row cannot leave a hole. */}
          <div className="mt-8 space-y-4">
            {posts.map((post) => (
              <PostListCard key={post.slug} post={post} hideCategory />
            ))}
            {posts.length === 0 && (
              <p className="rounded-2xl border border-stone-200 bg-white p-10 text-center text-sm text-stone-500">
                No articles in this topic yet — check back soon.
              </p>
            )}
          </div>

          <Pagination
            page={current}
            totalPages={totalPages}
            totalItems={total}
            pageSize={PAGE_SIZE}
            basePath={`/blog/category/${cat.slug}`}
            label="guides"
          />

          {elsewhere.length > 0 && (
            <div className="mt-12 border-t border-stone-200 pt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-800">
                More from the journal
              </p>
              {/* Category shown here, unlike the cards above — these come from
                  other lanes, so the label is the useful part. */}
              <div className="mt-4 space-y-4">
                {elsewhere.map((post) => (
                  <PostListCard key={post.slug} post={post} />
                ))}
              </div>
            </div>
          )}
        </div>

        <aside>
          {/* Was a row of chips below the fold at the bottom of the page.
              Up here it is both the fix for the empty column and the more
              useful place for it — with counts, so a reader can see which
              lane is worth the click. */}
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-800">
            More lanes
          </p>
          <div className="mt-4 space-y-2.5">
            {otherLanes.map((c) => {
              const n = hubCount(counts, c);
              return (
                <Link
                  key={c.slug}
                  href={`/blog/category/${c.slug}`}
                  className="group block rounded-2xl border border-stone-200 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#F26419] hover:shadow-[0_14px_34px_rgba(28,25,23,0.07)]"
                >
                  <p className="font-display flex items-center gap-1.5 text-sm font-bold text-stone-900 transition-colors group-hover:text-orange-700">
                    {c.label}
                    <ArrowRight
                      size={13}
                      aria-hidden
                      className="transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-stone-500">
                    {c.blurb}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-orange-700">
                    {n} {n === 1 ? "guide" : "guides"}
                  </p>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl bg-[#FFF6EF] p-5">
            <p className="font-display text-sm font-bold text-orange-950">
              Free 15-page website audit
            </p>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">
              See exactly what is blocking your rankings and conversions —
              delivered in 48 hours.
            </p>
            <Link
              href="/free-audit"
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
            <NewsletterCard source="blog-category" />
          </div>
        </aside>
      </div>
    </section>
  );
}
