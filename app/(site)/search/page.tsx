import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().slice(0, 100);

  const [pages, posts] = query
    ? await Promise.all([
        db.page.findMany({
          where: {
            status: "PUBLISHED",
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { seoDescription: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 10,
          select: { slug: true, title: true, seoDescription: true },
        }),
        db.blogPost.findMany({
          where: {
            status: "PUBLISHED",
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { excerpt: { contains: query, mode: "insensitive" } },
              { body: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 10,
          select: { slug: true, title: true, excerpt: true },
        }),
      ])
    : [[], []];

  const total = pages.length + posts.length;

  return (
    <section className="mx-auto max-w-3xl px-6 pb-8 pt-12 sm:pt-16">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
        Search
      </h1>
      <form action="/search" method="get" className="mt-6 flex gap-2">
        <label htmlFor="q" className="sr-only">
          Search the site
        </label>
        <input
          id="q"
          name="q"
          defaultValue={query}
          placeholder="Search pages and articles…"
          className="w-full rounded-full border border-stone-300 bg-white px-5 py-3 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
        />
        <button
          type="submit"
          className="shrink-0 cursor-pointer rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-500"
        >
          Search
        </button>
      </form>

      {query && (
        <p className="mt-6 text-sm text-stone-500">
          {total === 0
            ? `No results for “${query}”.`
            : `${total} result${total === 1 ? "" : "s"} for “${query}”`}
        </p>
      )}

      <div className="mt-6 space-y-5">
        {pages.map((p) => (
          <Link key={p.slug} href={`/${p.slug}`} className="group block rounded-2xl border border-stone-200 bg-white p-5 transition-colors hover:border-orange-400">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Page</p>
            <h2 className="font-display mt-1 text-base font-bold text-stone-900 group-hover:text-orange-700">
              {p.title}
            </h2>
            {p.seoDescription && (
              <p className="mt-1 line-clamp-2 text-sm text-stone-500">{p.seoDescription}</p>
            )}
          </Link>
        ))}
        {posts.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="group block rounded-2xl border border-stone-200 bg-white p-5 transition-colors hover:border-orange-400">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Article</p>
            <h2 className="font-display mt-1 text-base font-bold text-stone-900 group-hover:text-orange-700">
              {p.title}
            </h2>
            {p.excerpt && (
              <p className="mt-1 line-clamp-2 text-sm text-stone-500">{p.excerpt}</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
