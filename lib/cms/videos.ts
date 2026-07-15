import type { VideoProvider } from "@prisma/client";

/** Parse a YouTube/Vimeo URL (or direct file URL) into provider + id. */
export function parseVideoUrl(
  url: string,
): { provider: VideoProvider; videoId: string } | null {
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,20})/,
  );
  if (yt) return { provider: "YOUTUBE", videoId: yt[1] };

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d{6,12})/);
  if (vimeo) return { provider: "VIMEO", videoId: vimeo[1] };

  if (/^(\/|https?:\/\/).+\.(mp4|webm)(\?.*)?$/i.test(url)) {
    return { provider: "FILE", videoId: url };
  }
  return null;
}

export function embedUrl(provider: VideoProvider, videoId: string): string {
  switch (provider) {
    case "YOUTUBE":
      return `https://www.youtube-nocookie.com/embed/${videoId}`;
    case "VIMEO":
      return `https://player.vimeo.com/video/${videoId}`;
    case "FILE":
      return videoId;
  }
}

export function defaultThumbnail(
  provider: VideoProvider,
  videoId: string,
): string | null {
  if (provider === "YOUTUBE") {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }
  return null;
}
