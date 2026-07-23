"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";

/**
 * Floating tap-to-call button, bottom-left so it never collides with the
 * bot launcher and back-to-top on the right. Mobile visitors get a
 * one-tap call to the India line; on desktop it reveals the number on
 * hover (you can't tap-to-call a desktop, but seeing the number still
 * converts). Appears after a short delay so it doesn't fight the hero.
 */
const PHONE = "+911204751400";
const PHONE_LABEL = "+91-120-475-1400";

export default function FloatingCall() {
  const [shown, setShown] = useState(false);

  // Flip on mount so the entrance transition plays from the opacity-0
  // first paint. A mount effect runs even in a background tab, so the
  // button is never stuck hidden the way a throttled timer could leave it.
  useEffect(() => setShown(true), []);

  return (
    <a
      href={`tel:${PHONE}`}
      aria-label={`Call us on ${PHONE_LABEL}`}
      className={`group fixed bottom-5 left-5 z-[120] flex items-center transition-all duration-300 ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F26419] text-white shadow-[0_10px_28px_rgba(124,45,18,0.4)] transition-transform group-hover:scale-105">
        <span className="absolute h-12 w-12 animate-ping rounded-full bg-[#F26419] opacity-20" aria-hidden />
        <Phone size={20} aria-hidden />
      </span>
      {/* Number reveals on hover — a desktop can't dial, but seeing it converts. */}
      <span className="pointer-events-none ml-0 max-w-0 overflow-hidden whitespace-nowrap rounded-full text-sm font-bold text-stone-800 opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-[12rem] group-hover:opacity-100 dark:text-stone-100">
        {PHONE_LABEL}
      </span>
    </a>
  );
}
