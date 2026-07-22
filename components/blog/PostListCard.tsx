import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { withBase } from "@/lib/base-path";
import { categoryByDb } from "@/lib/blog";

export type PostCardData = {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  coverUrl: string | null;
  publishedAt: Date | null;
  readingMinutes: number;
};

/**
 * Editorial list card: meta line, then the headline across the full card
 * width, then thumbnail left / excerpt right. The headline gets its own
 * row because sharing it with the thumbnail squeezed it into half the
 * column beside the sidebar.
 */
export default function PostListCard({ post }: { post: PostCardData }) {
  const category = categoryByDb(post.category)?.label ?? post.category;
  const date = post.publishedAt?.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-2xl border border-stone-200 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#F26419] hover:shadow-[0_16px_40px_rgba(28,25,23,0.08)] sm:p-6"
    >
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="font-semibold uppercase tracking-[0.14em] text-orange-800">
          {category}
        </span>
        <span aria-hidden className="text-stone-300">
          ·
        </span>
        <span className="text-stone-400">
          {date} · {post.readingMinutes} min read
        </span>
      </p>

      <h3 className="font-display mt-2 text-lg font-extrabold leading-snug tracking-tight text-stone-900 transition-colors group-hover:text-orange-700 sm:text-xl">
        {post.title}
      </h3>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        <span className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-stone-900 sm:h-[105px] sm:w-[140px] lg:h-[126px] lg:w-[168px]">
          {post.coverUrl ? (
            <Image
              src={withBase(post.coverUrl)}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 168px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-900 via-orange-600 to-amber-400">
              <Newspaper size={22} className="text-white/80" aria-hidden />
            </span>
          )}
          <span className="absolute inset-0 bg-[#F26419]/25 mix-blend-color" aria-hidden />
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          {post.excerpt && (
            <span className="line-clamp-3 text-sm leading-relaxed text-stone-600">
              {post.excerpt}
            </span>
          )}
          <span className="mt-auto flex items-center gap-1.5 pt-3 text-sm font-bold text-[#F26419]">
            Read the playbook
            <ArrowRight
              size={13}
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </span>
        </span>
      </div>
    </Link>
  );
}
