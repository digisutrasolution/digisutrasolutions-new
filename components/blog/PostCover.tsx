import Image from "next/image";
import { Newspaper } from "lucide-react";
import { withBase } from "@/lib/base-path";

/**
 * A post cover, wherever one is shown.
 *
 * Three states, owned here so no caller decides again — the previous approach
 * repeated all three at every call site, and the orange placeholder alone was
 * copy-pasted six times:
 *
 *   1. dimensions known  → the image WHOLE, at its own ratio, bounded by the
 *      caller's box. Real width/height also reserve the right space before
 *      load, so removing the crop costs no layout shift.
 *   2. dimensions unknown → the caller's fixed box with object-cover. A crop
 *      beats a wrongly-shaped gap, and it keeps covers that predate the
 *      dimension backfill rendering exactly as they did.
 *   3. no cover at all   → the gradient placeholder.
 *
 * These covers are designed banners whose headline and footer carry the
 * message, which is why cropping them is worse here than it would be for
 * photography.
 */
export default function PostCover({
  url,
  width,
  height,
  maxW,
  maxH,
  sizes,
  fallbackBox,
  iconSize = 20,
  zoom = false,
  crop = false,
  className = "",
  capClass = "max-w-[var(--cover-w)]",
  priority = false,
  children,
}: {
  url: string | null;
  width?: number | null;
  height?: number | null;
  /** The width the cover may occupy at its largest. */
  maxW: number;
  /** Ceiling on height, so a portrait cover cannot tower over its neighbours. */
  maxH: number;
  sizes: string;
  /** Tailwind box used when the dimensions are unknown (state 2). */
  fallbackBox: string;
  iconSize?: number;
  /** The hover scale the cards use; off for the article hero. */
  zoom?: boolean;
  /** Keep the fixed box even when the dimensions ARE known. For thumbnails so
      small that a whole banner is unreadable anyway (~64-80px), where a column
      of uniform boxes reads as a tidy list and ragged true-ratio ones read as
      broken. Deliberate, not a fallback. */
  crop?: boolean;
  className?: string;
  /** Where the width cap applies. Defaults to every breakpoint; a card that
      stacks on mobile passes "sm:max-w-[var(--cover-w)]" so the cover stays
      full-bleed on a phone, where there is no neighbour to crowd. */
  capClass?: string;
  priority?: boolean;
  /** Overlays — a category chip, a reading time. Rendered inside the cover and
      above the tint so they stay glued to the IMAGE, not to a wrapper that may
      be wider than it once a portrait cover is capped. */
  children?: React.ReactNode;
}) {
  /* self-start matters: in a flex row (a thumbnail beside a headline) the
     default align-items:stretch grows this box to the row's height while the
     image inside keeps its own, and the difference showed as a black band of
     bare bg-stone-900 under the picture. */
  const shell = `relative block self-start overflow-hidden bg-stone-900 ${className}`;
  const motion = zoom
    ? "transition-transform duration-500 group-hover:scale-[1.06]"
    : "";

  // 3 — nothing to show.
  if (!url) {
    return (
      <span className={`${shell} ${fallbackBox}`}>
        <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-900 via-orange-600 to-amber-400">
          <Newspaper size={iconSize} className="text-white/80" aria-hidden />
        </span>
        <Tint />
        {children}
      </span>
    );
  }

  // 2 — a cover we could never measure, or one deliberately kept in its box.
  if (crop || !width || !height) {
    return (
      <span className={`${shell} ${fallbackBox}`}>
        <Image
          src={withBase(url)}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          className={`object-cover ${motion}`}
        />
        <Tint />
        {children}
      </span>
    );
  }

  // 1 — whole, at its own ratio.
  return (
    <span
      className={`${shell} ${capClass}`}
      style={{ "--cover-w": `${boxWidth(width, height, maxW, maxH)}px` } as React.CSSProperties}
    >
      <Image
        src={withBase(url)}
        alt=""
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        className={`h-auto w-full ${motion}`}
      />
      <Tint />
      {children}
    </span>
  );
}

/**
 * The width a cover gets: its own ratio, bounded by BOTH the width and the
 * height allowed. Scaling the width down for a tall image keeps the whole
 * picture visible — capping the height instead would need object-contain and
 * put letterbox bars back.
 */
function boxWidth(w: number, h: number, maxW: number, maxH: number): number {
  return Math.round(Math.min(maxW, maxH * (w / h)));
}

/** The brand wash every cover carries. */
function Tint() {
  return (
    <span className="absolute inset-0 bg-[#F26419]/25 mix-blend-color" aria-hidden />
  );
}
