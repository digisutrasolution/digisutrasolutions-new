"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Section } from "@/lib/cms/sections";

/* A CTA bar that follows the reader down a landing page.

   Two collisions to respect, both real on this site:

   1. The bottom-right corner already holds the WhatsApp FAB (z-120) and the
      SutraBot launcher (z-130). This bar sits at z-110 — UNDER both — and
      keeps its content clear of that corner with right padding, so the
      buttons stay tappable and nothing is hidden beneath them.
   2. A fixed bar covers whatever the page ends with. A spacer in normal flow
      reserves the same height, so the last section is never obscured.

   It appears only after the reader has passed the hero, otherwise it competes
   with the hero's own CTA for the same click. */

export default function StickyCtaBar({
  s,
}: {
  s: Extract<Section, { type: "stickyCta" }>;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > s.showAfter);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [s.showAfter]);

  if (!s.ctaLabel && !s.text) return null;

  return (
    <>
      {/* Flow spacer — same height as the bar so the page can be scrolled
          fully into view behind it. */}
      <div className="h-20 sm:h-16" aria-hidden />
      <div
        className={`fixed inset-x-0 bottom-0 z-[110] border-t border-stone-800 bg-stone-900/95 backdrop-blur transition-transform duration-300 motion-reduce:transition-none ${
          shown ? "translate-y-0" : "translate-y-full"
        }`}
        /* Hidden from assistive tech AND keyboard while it is off-screen —
           aria-hidden alone still leaves the buttons tabbable, so Tab would
           land on something nobody can see. */
        aria-hidden={!shown}
        inert={!shown}
      >
        {/* The right padding is the FAB lane. Those buttons sit at right-6 and
            are ~56px wide, so anything under ~80px leaves the CTA touching
            them — measured at 4px before this was widened. */}
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-6 py-3 pr-24 sm:pr-28">
          {s.text && (
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-stone-100">{s.text}</p>
          )}
          <div className="flex shrink-0 items-center gap-2">
            {s.cta2Label && (
              <Link
                href={s.cta2Href || "#"}
                className="rounded-full border border-white/40 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10 sm:text-sm"
              >
                {s.cta2Label}
              </Link>
            )}
            <Link
              href={s.ctaHref || "/contact"}
              className="rounded-full bg-[#F26419] px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-orange-600 sm:text-sm"
            >
              {s.ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
