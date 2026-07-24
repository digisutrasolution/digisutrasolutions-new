"use client";

import { Phone } from "lucide-react";

/**
 * Floating tap-to-call button, bottom-left so it never collides with the
 * bot launcher and back-to-top on the right. Mobile visitors get a
 * one-tap call to the India line; on desktop it reveals the number on
 * hover (you can't tap-to-call a desktop, but seeing the number still
 * converts).
 *
 * The entrance is a CSS keyframe rather than a mount effect flipping state:
 * the effect version tripped react-hooks/set-state-in-effect and cost a
 * render, and .animate-fab-in is reset under prefers-reduced-motion.
 */
const PHONE = "+911204751400";
const PHONE_LABEL = "+91-120-475-1400";

export default function FloatingCall() {
  return (
    <a
      href={`tel:${PHONE}`}
      aria-label={`Call us on ${PHONE_LABEL}`}
      // bottom-16 left-5 mirrors the bot launcher on the opposite corner.
      // 64px clears the footer's ~55px orange bar: at bottom-5 this orange
      // button sat on top of it and became invisible. h-14 fixes the box to
      // the circle so the baseline lines up with the launcher.
      className="animate-fab-in group fixed bottom-16 left-5 z-[120] flex h-14 items-center"
    >
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#F26419] text-white shadow-[0_10px_28px_rgba(124,45,18,0.4)] transition-transform group-hover:scale-105">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#F26419] opacity-20" aria-hidden />
        <Phone size={22} aria-hidden />
      </span>
      {/* Number reveals on hover — a desktop can't dial, but seeing it converts. */}
      <span className="pointer-events-none ml-0 max-w-0 overflow-hidden whitespace-nowrap rounded-full text-sm font-bold text-stone-800 opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-[12rem] group-hover:opacity-100 dark:text-stone-100">
        {PHONE_LABEL}
      </span>
    </a>
  );
}
