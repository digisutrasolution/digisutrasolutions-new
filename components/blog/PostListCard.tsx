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
  /* Intrinsic cover size. Present ⇒ the thumbnail is shown whole at its own
     ratio; null ⇒ it falls back to the old fixed, cropped box. */
  coverWidth?: number | null;
  coverHeight?: number | null;
  publishedAt: Date | null;
  readingMinutes: number;
};

/** Thumbnail width. Wider than the old 168px because these covers are designed
    banners carrying a headline, not stock photography — at 168 the words were
    just texture. */
const THUMB_W = 200;
/** …and a ceiling on height, so a portrait cover cannot tower over the excerpt
    beside it. A 1120×1400 cover would otherwise render 200×250. */
const THUMB_MAX_H = 200;

/** The box a cover gets: its own ratio, bounded by both the width and the
    height above. Scaling the WIDTH down for a tall image keeps the whole
    picture visible — capping the height instead would need object-contain and
    put the letterbox bars back. */
function thumbBox(w: number, h: number): number {
  const ratio = w / h;
  return Math.round(Math.min(THUMB_W, THUMB_MAX_H * ratio));
}

/**
 * Editorial list card: meta line, then the headline across the full card
 * width, then thumbnail left / excerpt right. The headline gets its own
 * row because sharing it with the thumbnail squeezed it into half the
 * column beside the sidebar.
 */
export default function PostListCard({
  post,
  /* Set on a category hub. categoryByDb resolves aliases, so every card in a
     hub prints the SAME label — "WEB & DESIGN" six times down one column is
     noise, not information. Hidden, the meta line is date · read time, which
     is exactly what the hub's old grid cards showed. */
  hideCategory = false,
}: {
  post: PostCardData;
  hideCategory?: boolean;
}) {
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
        {!hideCategory && (
          <>
            <span className="font-semibold uppercase tracking-[0.14em] text-orange-800">
              {category}
            </span>
            <span aria-hidden className="text-stone-300">
              ·
            </span>
          </>
        )}
        <span className="text-stone-400">
          {date} · {post.readingMinutes} min read
        </span>
      </p>

      <h3 className="font-display mt-2 text-lg font-extrabold leading-snug tracking-tight text-stone-900 transition-colors group-hover:text-orange-700 sm:text-xl">
        {post.title}
      </h3>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        {/* Whole image when we know its shape.

            The thumbnail used to be a fixed 4:3 box with object-cover, which
            sliced the top and bottom off covers that are designed banners —
            the headline and the benefits strip, the two parts carrying the
            message. Fixing the WIDTH and letting height follow the real ratio
            avoids both the crop and the letterbox bars object-contain would
            leave. Safe in a list, unlike a grid: these rows already vary in
            height with the excerpt, so nothing falls out of alignment. */}
        {post.coverUrl && post.coverWidth && post.coverHeight ? (
          <span
            /* The cap applies from sm up only. On mobile the card stacks, so a
               full-width banner at its own ratio is the best it can look —
               pinning it to 200px there would shrink it for no reason. */
            className="relative block w-full shrink-0 overflow-hidden rounded-xl bg-stone-900 sm:max-w-[var(--thumb-w)]"
            style={
              {
                "--thumb-w": `${thumbBox(post.coverWidth, post.coverHeight)}px`,
              } as React.CSSProperties
            }
          >
            <Image
              src={withBase(post.coverUrl)}
              alt=""
              width={post.coverWidth}
              height={post.coverHeight}
              sizes={`(max-width: 640px) 100vw, ${THUMB_W}px`}
              className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.06]"
            />
            <span className="absolute inset-0 bg-[#F26419]/25 mix-blend-color" aria-hidden />
          </span>
        ) : (
          /* Unknown dimensions — a legacy row, or a cover we could not measure.
             Keep the old box rather than reserving a wrongly-shaped gap. */
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
        )}

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
