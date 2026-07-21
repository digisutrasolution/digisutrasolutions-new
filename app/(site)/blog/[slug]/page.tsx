import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowRight, Lightbulb, Newspaper } from "lucide-react";
import AdSlot from "@/components/blog/AdSlot";
import ArticleToc from "@/components/blog/ArticleToc";
import Reviews from "@/components/blog/Reviews";
import ShareRail from "@/components/blog/ShareRail";
import { withBase } from "@/lib/base-path";
import { db } from "@/lib/db";
import {
  categoryByDb,
  extractHeadings,
  extractTakeaways,
  slugifyHeading,
} from "@/lib/blog";

export const dynamic = "force-dynamic";

import { absUrl, SITE_URL } from "@/lib/site";

const getPost = cache(async (slug: string) => {
  return db.blogPost.findUnique({ where: { slug } });
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post || post.status !== "PUBLISHED") return {};
  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? undefined,
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    robots: post.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: post.seoTitle ?? post.title,
      description: post.seoDescription ?? post.excerpt ?? undefined,
      url: `${SITE_URL}/blog/${post.slug}`,
      type: "article",
      ...(post.coverUrl ? { images: [{ url: absUrl(post.coverUrl) }] } : {}),
    },
  };
}

/** Body renderer: blank-line paragraphs, ## (anchored) and ### headings. */
function renderBody(body: string) {
  return body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, i) => {
      if (block.startsWith("### ")) {
        return (
          <h3 key={i} className="font-display mt-8 text-lg font-bold text-stone-900">
            {block.slice(4)}
          </h3>
        );
      }
      if (block.startsWith("## ")) {
        const text = block.slice(3);
        return (
          <h2
            key={i}
            id={slugifyHeading(text)}
            className="font-display mt-10 scroll-mt-40 text-2xl font-extrabold tracking-tight text-stone-900"
          >
            {text}
          </h2>
        );
      }
      return (
        <p key={i} className="mt-5 text-base leading-relaxed text-stone-600">
          {block}
        </p>
      );
    });
}

const dateFmt = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post || post.status !== "PUBLISHED") notFound();

  const [related, reviews] = await Promise.all([
    db.blogPost.findMany({
      where: { status: "PUBLISHED", slug: { not: post.slug } },
      orderBy: { publishedAt: "desc" },
      select: {
        slug: true,
        title: true,
        category: true,
        coverUrl: true,
        readingMinutes: true,
      },
      take: 6,
    }),
    db.blogComment.findMany({
      where: { postId: post.id, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        body: true,
        rating: true,
        reply: true,
        createdAt: true,
      },
    }),
  ]);
  const ratings = reviews.filter((r) => r.rating != null).map((r) => r.rating as number);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : null;
  // Same-category first, newest first, two cards.
  const relatedSorted = [
    ...related.filter((r) => r.category === post.category),
    ...related.filter((r) => r.category !== post.category),
  ].slice(0, 2);

  const url = `${SITE_URL}/blog/${post.slug}`;
  const cat = categoryByDb(post.category);
  const headings = extractHeadings(post.body);
  const takeaways = extractTakeaways(post.body, 4);
  const wasUpdated =
    post.publishedAt &&
    post.updatedAt.getTime() - post.publishedAt.getTime() > 24 * 60 * 60 * 1000;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: post.title,
        description: post.seoDescription ?? post.excerpt,
        datePublished: post.publishedAt?.toISOString(),
        dateModified: post.updatedAt.toISOString(),
        author: { "@type": "Person", name: post.authorName ?? "DigiSutra Solutions" },
        publisher: { "@type": "Organization", name: "DigiSutra Solutions" },
        mainEntityOfPage: url,
        ...(post.coverUrl ? { image: absUrl(post.coverUrl) } : {}),
        ...(avgRating != null
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: Number(avgRating.toFixed(1)),
                bestRating: 5,
                worstRating: 1,
                ratingCount: ratings.length,
              },
            }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Journal", item: `${SITE_URL}/blog` },
          ...(cat
            ? [
                {
                  "@type": "ListItem",
                  position: 3,
                  name: cat.label,
                  item: `${SITE_URL}/blog/category/${cat.slug}`,
                },
              ]
            : []),
          { "@type": "ListItem", position: cat ? 4 : 3, name: post.title, item: url },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto max-w-[1280px] px-6 pb-16 pt-12 sm:pb-24 sm:pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="text-xs text-stone-400">
        <Link href="/" className="hover:text-orange-700">
          Home
        </Link>{" "}
        /{" "}
        <Link href="/blog" className="text-orange-700 hover:underline">
          Journal
        </Link>{" "}
        /{" "}
        {cat ? (
          <Link
            href={`/blog/category/${cat.slug}`}
            className="hover:text-orange-700"
          >
            {cat.label}
          </Link>
        ) : (
          post.category
        )}
      </nav>

      <div className="mt-4 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12">
        {/* Sticky rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-40 space-y-4">
            <ArticleToc headings={headings} />
            <div className="rounded-2xl bg-stone-900 p-5">
              <p className="font-display text-sm font-bold text-white">
                Is your site holding you back?
              </p>
              <p className="mt-1 text-sm leading-relaxed text-stone-400">
                Free 15-page audit — SEO, speed, UX and conversion. In 48 hours.
              </p>
              <Link
                href="/#audit"
                className="mt-3 block rounded-full bg-[#F26419] py-2 text-center text-sm font-bold text-white transition-colors hover:bg-orange-700"
              >
                Get my free audit
              </Link>
            </div>
            <AdSlot placement="ARTICLE_SIDEBAR" />
          </div>
        </aside>

        {/* Article */}
        <article className="mt-2 max-w-3xl lg:mt-0">
          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-stone-900 sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F26419] text-[11px] font-bold text-white">
              {(post.authorName ?? "DigiSutra")
                .split(/\s+/)
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <p className="text-sm text-stone-500">
              {post.authorName ?? "DigiSutra team"}
              {post.publishedAt && <> · {dateFmt(post.publishedAt)}</>}
              {wasUpdated && (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-medium text-emerald-700">
                    Updated {dateFmt(post.updatedAt)}
                  </span>
                </>
              )}{" "}
              · {post.readingMinutes} min read
            </p>
            <div className="ml-auto">
              <ShareRail url={url} title={post.title} />
            </div>
          </div>

          {post.coverUrl && (
            <div className="relative mt-6 h-64 overflow-hidden rounded-3xl sm:h-80">
              <Image
                src={withBase(post.coverUrl)}
                alt=""
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            </div>
          )}

          {takeaways.length >= 3 && (
            <div className="mt-6 rounded-2xl border border-[#FFE3CC] bg-[#FFF6EF] p-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-orange-800">
                <Lightbulb size={13} aria-hidden /> Key takeaways
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {takeaways.map((t) => (
                  <li
                    key={t}
                    className="flex gap-2 text-sm leading-relaxed text-stone-600"
                  >
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#F26419]" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-2">{renderBody(post.body)}</div>

          {post.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-900"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Author box (E-E-A-T) */}
          <div className="mt-10 flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F26419] text-sm font-bold text-white">
              DS
            </span>
            <div>
              <p className="font-display text-sm font-bold text-stone-900">
                Written by the DigiSutra growth team
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-stone-500">
                Digital marketing agency in Noida, India — SEO, ads and AI
                automation for startups and SMBs across 12 countries.
              </p>
            </div>
          </div>

          <Reviews postSlug={post.slug} reviews={reviews} average={avgRating} />

          {relatedSorted.length > 0 && (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {relatedSorted.map((r, i) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group overflow-hidden rounded-2xl border border-stone-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(124,45,18,0.12)]"
                >
                  <div className="relative h-28 overflow-hidden bg-stone-900">
                    {r.coverUrl ? (
                      <Image
                        src={withBase(r.coverUrl)}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 360px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-900 via-orange-600 to-amber-400">
                        <Newspaper size={20} className="text-white/80" aria-hidden />
                      </span>
                    )}
                    <span
                      className="absolute inset-0 bg-[#F26419]/25 mix-blend-color"
                      aria-hidden
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] text-stone-400">
                      {i === 0 ? "Up next" : "Related"} ·{" "}
                      {categoryByDb(r.category)?.label ?? r.category} ·{" "}
                      {r.readingMinutes} min
                    </p>
                    <p className="font-display mt-1 text-sm font-bold leading-snug text-stone-900 transition-colors group-hover:text-orange-700">
                      {r.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/blog"
            className="mt-10 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 transition-colors hover:text-orange-700"
          >
            <ArrowRight size={14} aria-hidden className="rotate-180" /> All
            articles
          </Link>
        </article>
      </div>
    </div>
  );
}
