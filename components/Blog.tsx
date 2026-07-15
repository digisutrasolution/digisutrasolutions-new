import Link from "next/link";
import { Mail, Newspaper } from "lucide-react";
import Reveal from "@/components/Reveal";
import { db } from "@/lib/db";
import { BLOG_POSTS } from "@/lib/data";

const FALLBACK_COVERS = [
  "/blog/lead-generation.jpg",
  "/blog/local-seo.jpg",
  "/blog/ai-chatbots.jpg",
];

type Card = {
  key: string;
  href: string;
  title: string;
  category: string;
  date: string;
  coverUrl: string | null;
  excerpt: string;
  readingMinutes: number;
  authorName: string | null;
};

/**
 * Home journal section — featured article + compact list. Pulls the latest
 * published CMS posts; falls back to static placeholders until posts exist.
 */
export default async function Blog() {
  const dbPosts = await db.blogPost
    .findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 5,
      select: {
        slug: true,
        title: true,
        category: true,
        coverUrl: true,
        excerpt: true,
        readingMinutes: true,
        publishedAt: true,
        authorName: true,
      },
    })
    .catch(() => []);

  const cards: Card[] =
    dbPosts.length > 0
      ? dbPosts.map((p) => ({
          key: p.slug,
          href: `/blog/${p.slug}`,
          title: p.title,
          category: p.category,
          date:
            p.publishedAt?.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }) ?? "",
          coverUrl: p.coverUrl,
          excerpt: p.excerpt,
          readingMinutes: p.readingMinutes,
          authorName: p.authorName,
        }))
      : BLOG_POSTS.map((p, i) => ({
          key: p.title,
          href: "/blog",
          title: p.title,
          category: p.category,
          date: p.date,
          coverUrl: FALLBACK_COVERS[i] ?? null,
          excerpt: "",
          readingMinutes: 4,
          authorName: null,
        }));

  const featured = cards[0];
  const rest = cards.slice(1);

  return (
    <section id="blog" className="mx-auto max-w-[1280px] px-6 pt-20 sm:pt-24">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
              Journal
            </p>
            <h2 className="font-display max-w-xl text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              Latest{" "}
              <span className="font-serif-accent font-medium italic text-orange-600">
                thinking
              </span>
            </h2>
          </div>
          <Link
            href="/blog"
            className="text-sm font-semibold text-stone-900 underline decoration-orange-500 decoration-2 underline-offset-4 transition-colors hover:text-orange-700"
          >
            All articles →
          </Link>
        </div>
      </Reveal>
      <div className="mt-10 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Featured article */}
        {featured && (
          <Reveal>
            <Link
              href={featured.href}
              className="group block h-full overflow-hidden rounded-2xl border border-stone-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(124,45,18,0.14)]"
            >
              <div className="relative h-52 overflow-hidden sm:h-60">
                {featured.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featured.coverUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-900 via-orange-600 to-amber-400">
                    <Newspaper size={30} className="text-white/80" aria-hidden />
                  </div>
                )}
                <span
                  className="absolute inset-0 bg-[#F26419]/25 mix-blend-color"
                  aria-hidden
                />
                <span
                  className="absolute inset-0 bg-[linear-gradient(160deg,rgba(124,45,18,0.3),rgba(18,12,8,0.3))] mix-blend-multiply"
                  aria-hidden
                />
                <span className="absolute left-3.5 top-3.5 rounded-full bg-orange-50/95 px-3 py-1 text-xs font-semibold text-orange-950">
                  {featured.category}
                </span>
                <span className="absolute bottom-3 right-3 rounded-full bg-stone-900/70 px-2.5 py-1 text-[11px] text-[#FDBA74]">
                  {featured.readingMinutes} min read
                </span>
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-xs text-stone-400">
                  {featured.date}
                  {featured.authorName ? ` · ${featured.authorName}` : ""}
                </p>
                <h3 className="font-display mt-1.5 text-xl font-bold leading-snug text-stone-900 sm:text-2xl">
                  {featured.title}
                </h3>
                {featured.excerpt && (
                  <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-stone-500">
                    {featured.excerpt}
                  </p>
                )}
                <p className="mt-4 text-sm font-bold text-[#F26419]">
                  Read article →
                </p>
              </div>
            </Link>
          </Reveal>
        )}

        {/* Recent list + subscribe nudge */}
        <Reveal delay={0.1}>
          <div className="flex h-full flex-col gap-2">
            {rest.map((post) => (
              <Link
                key={post.key}
                href={post.href}
                className="group flex gap-3.5 rounded-xl p-3 transition-colors hover:bg-[#FFF3E8]"
              >
                <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-900">
                  {post.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.coverUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
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
                  <span className="block text-[11px] text-stone-400">
                    {post.category} · {post.date}
                  </span>
                  <span className="font-display mt-1 block text-sm font-bold leading-snug text-stone-900 transition-colors group-hover:text-orange-700">
                    {post.title}
                  </span>
                  <span className="mt-1 block text-[11px] text-stone-400">
                    {post.readingMinutes} min read
                  </span>
                </span>
              </Link>
            ))}
            <Link
              href="/contact"
              className="mt-auto flex items-center gap-2.5 border-t border-dashed border-[#F0E2D6] px-3 pb-1 pt-4 text-sm text-stone-600 transition-colors hover:text-orange-700"
            >
              <Mail size={15} className="shrink-0 text-[#F26419]" aria-hidden />
              <span>
                Get growth notes monthly —{" "}
                <b className="font-bold text-[#F26419]">subscribe →</b>
              </span>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
