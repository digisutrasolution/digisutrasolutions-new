import Link from "next/link";
import PostCover from "@/components/blog/PostCover";
import HomeSubscribe from "@/components/HomeSubscribe";
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
  coverWidth: number | null;
  coverHeight: number | null;
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
        coverWidth: true,
        coverHeight: true,
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
          coverWidth: p.coverWidth,
          coverHeight: p.coverHeight,
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
          // Static placeholders, only used when no post exists yet — unmeasured,
          // so they render through PostCover's fixed-box path.
          coverWidth: null,
          coverHeight: null,
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
              {/* The chip and reading time live INSIDE the cover so they stay
                  glued to the image once a portrait one is width-capped. */}
              <PostCover
                url={featured.coverUrl}
                width={featured.coverWidth}
                height={featured.coverHeight}
                /* Generous enough that a landscape cover fills the card edge to
                   edge (686 / 1.39 = 493) instead of sitting inset, which reads
                   as a mistake. The height cap is what stops a portrait one
                   towering — it centres at ~400x500 instead. */
                maxW={760}
                maxH={500}
                sizes="(max-width: 1024px) 100vw, 620px"
                fallbackBox="h-52 sm:h-60"
                iconSize={30}
                zoom
                className="mx-auto w-full"
              >
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
              </PostCover>
              <div className="p-5 sm:p-6">
                <p className="text-xs text-stone-500">
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
                <PostCover
                  url={post.coverUrl}
                  width={post.coverWidth}
                  height={post.coverHeight}
                  maxW={80}
                  maxH={80}
                  sizes="80px"
                  fallbackBox="h-16 w-20"
                  iconSize={16}
                  zoom
                  /* Restored to the uniform 80x64 box. Same reasoning as the
                     article rail: too small to read a banner whole, and the
                     even column is the point. The featured cover above still
                     shows whole — that one is big enough to be worth reading. */
                  crop
                  className="w-20 shrink-0 rounded-lg"
                />
                <span className="min-w-0">
                  <span className="block text-xs text-stone-500">
                    {post.category} · {post.date}
                  </span>
                  <span className="font-display mt-1 block text-sm font-bold leading-snug text-stone-900 transition-colors group-hover:text-orange-700">
                    {post.title}
                  </span>
                  <span className="mt-1 block text-xs text-stone-500">
                    {post.readingMinutes} min read
                  </span>
                </span>
              </Link>
            ))}
            <HomeSubscribe />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
