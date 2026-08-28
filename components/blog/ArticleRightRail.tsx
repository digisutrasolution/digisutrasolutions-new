import Link from "next/link";
import AdSlot from "@/components/blog/AdSlot";
import PostCover from "@/components/blog/PostCover";
import NewsletterCard from "@/components/blog/NewsletterCard";
import { categoryByDb } from "@/lib/blog";

type RailPost = {
  slug: string;
  title: string;
  category: string;
  coverUrl: string | null;
  coverWidth: number | null;
  coverHeight: number | null;
  readingMinutes: number;
};

/**
 * Second article rail, shown from xl up where there is room for it.
 * Everything in it is admin-managed: the sponsor card comes from
 * /admin/ads (ARTICLE_RIGHT) and renders nothing when no banner is live,
 * and the reading list is drawn from published posts.
 */
export default function ArticleRightRail({ posts }: { posts: RailPost[] }) {
  return (
    <aside className="hidden xl:block">
      <div className="sticky top-40 space-y-6">
        <AdSlot placement="ARTICLE_RIGHT" />

        <NewsletterCard source="blog-article" />

        {posts.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
              Keep reading
            </p>
            <ul className="mt-3 space-y-3">
              {posts.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="group flex gap-3 rounded-xl p-1.5 transition-colors hover:bg-[#FFF7F0]"
                  >
                    <PostCover
                      url={p.coverUrl}
                      width={p.coverWidth}
                      height={p.coverHeight}
                      maxW={64}
                      maxH={64}
                      sizes="64px"
                      fallbackBox="h-12 w-16"
                      iconSize={13}
                      zoom
                      /* Back to the uniform 64x48 box these had before. At this
                         size a whole banner is unreadable either way, and a
                         column of equal boxes beside the headlines is what
                         makes the rail scan as a list. */
                      crop
                      className="w-16 shrink-0 rounded-lg"
                    />
                    <span className="min-w-0">
                      <span className="block text-[11px] text-stone-400">
                        {categoryByDb(p.category)?.label ?? p.category} ·{" "}
                        {p.readingMinutes} min
                      </span>
                      <span className="font-display mt-0.5 line-clamp-2 block text-[13px] font-bold leading-snug text-stone-800 transition-colors group-hover:text-orange-700">
                        {p.title}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
