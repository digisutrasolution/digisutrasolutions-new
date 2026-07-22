import Image from "next/image";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import AdSlot from "@/components/blog/AdSlot";
import NewsletterCard from "@/components/blog/NewsletterCard";
import { withBase } from "@/lib/base-path";
import { categoryByDb } from "@/lib/blog";

type RailPost = {
  slug: string;
  title: string;
  category: string;
  coverUrl: string | null;
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
                    <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-900">
                      {p.coverUrl ? (
                        <Image
                          src={withBase(p.coverUrl)}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-900 via-orange-600 to-amber-400">
                          <Newspaper size={13} className="text-white/80" aria-hidden />
                        </span>
                      )}
                      <span
                        className="absolute inset-0 bg-[#F26419]/25 mix-blend-color"
                        aria-hidden
                      />
                    </span>
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
