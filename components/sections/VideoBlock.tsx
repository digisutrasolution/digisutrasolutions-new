import { withBase } from "@/lib/base-path";
import { db } from "@/lib/db";
import { embedUrl } from "@/lib/cms/videos";

/** Async server component: looks up a library video by slug and embeds it. */
export default async function VideoBlock({
  slug,
  heading,
}: {
  slug: string;
  heading?: string;
}) {
  if (!slug) return null;
  const video = await db.video.findUnique({ where: { slug } }).catch(() => null);
  if (!video) return null;

  return (
    <section className="mx-auto max-w-4xl px-6 pt-16 sm:pt-20">
      {heading && (
        <h2 className="font-display mb-6 max-w-2xl text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
          {heading}
        </h2>
      )}
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-stone-900 shadow-[0_24px_60px_rgba(124,45,18,0.15)]">
        {video.provider === "FILE" ? (
          <video
            controls
            preload="metadata"
            poster={video.thumbnailUrl ? withBase(video.thumbnailUrl) : undefined}
            className="aspect-video w-full"
            src={withBase(video.videoId)}
          />
        ) : (
          <iframe
            src={embedUrl(video.provider, video.videoId)}
            title={video.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="aspect-video w-full"
          />
        )}
      </div>
      {video.description && (
        <p className="mt-4 text-sm leading-relaxed text-stone-600">
          {video.description}
        </p>
      )}
    </section>
  );
}
