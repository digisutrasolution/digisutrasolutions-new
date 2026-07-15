import Reveal from "@/components/Reveal";
import { withBase } from "@/lib/base-path";
import { db } from "@/lib/db";
import { embedUrl } from "@/lib/cms/videos";

/** Home section: featured library videos. Renders nothing when none exist. */
export default async function FeaturedVideos() {
  const videos = await db.video
    .findMany({
      where: { featured: true },
      orderBy: { createdAt: "desc" },
      take: 2,
    })
    .catch(() => []);
  if (videos.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-20 sm:pt-24">
      <Reveal>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
          Watch
        </p>
        <h2 className="font-display max-w-xl text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
          See the work in{" "}
          <span className="font-serif-accent font-medium italic text-orange-600">
            motion
          </span>
        </h2>
      </Reveal>
      <div
        className={`mt-10 grid grid-cols-1 gap-6 ${videos.length > 1 ? "lg:grid-cols-2" : "lg:max-w-3xl"}`}
      >
        {videos.map((video, i) => (
          <Reveal key={video.id} delay={i * 0.08}>
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
            <h3 className="font-display mt-3 text-base font-bold text-stone-900">
              {video.title}
            </h3>
            {video.description && (
              <p className="mt-1 text-sm text-stone-500">{video.description}</p>
            )}
          </Reveal>
        ))}
      </div>
    </section>
  );
}
