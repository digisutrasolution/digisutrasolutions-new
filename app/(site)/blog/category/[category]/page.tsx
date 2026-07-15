import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Newspaper } from "lucide-react";
import { withBase } from "@/lib/base-path";
import { db } from "@/lib/db";
import { BLOG_CATEGORIES, categoryBySlug } from "@/lib/blog";

export const dynamic = "force-dynamic";

import { SITE_URL } from "@/lib/site";

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
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = categoryBySlug(category);
  if (!cat) notFound();

  const posts = await db.blogPost.findMany({
    where: { status: "PUBLISHED", category: cat.db },
    orderBy: { publishedAt: "desc" },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      coverUrl: true,
      publishedAt: true,
      readingMinutes: true,
    },
  });

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 transition-colors hover:text-orange-700"
      >
        <ArrowLeft size={14} aria-hidden /> All topics
      </Link>
      <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
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
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-stone-600">
        {cat.intro}
      </p>

      {posts.length === 0 ? (
        <p className="py-20 text-center text-sm text-stone-500">
          No articles in this topic yet — check back soon.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
              <div className="relative h-44 overflow-hidden rounded-2xl bg-stone-900">
                {post.coverUrl ? (
                  <Image
                    src={withBase(post.coverUrl)}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-900 via-orange-600 to-amber-400">
                    <Newspaper size={28} className="text-white/80" aria-hidden />
                  </div>
                )}
                <span
                  className="absolute inset-0 bg-[#F26419]/25 mix-blend-color"
                  aria-hidden
                />
              </div>
              <p className="mt-3 text-xs text-stone-400">
                {post.publishedAt?.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}{" "}
                · {post.readingMinutes} min read
              </p>
              <h2 className="font-display mt-1 text-lg font-bold leading-snug text-stone-900 group-hover:text-orange-700">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-stone-500">
                  {post.excerpt}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-14 border-t border-stone-200 pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-800">
          More lanes
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {BLOG_CATEGORIES.filter((c) => c.slug !== cat.slug).map((c) => (
            <Link
              key={c.slug}
              href={`/blog/category/${c.slug}`}
              className="group flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:border-[#F26419] hover:text-orange-700"
            >
              {c.label}
              <ArrowRight
                size={13}
                aria-hidden
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
