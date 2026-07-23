"use client";

import { useRef } from "react";

/**
 * Card whose glow follows the cursor. The pointer position is written to
 * CSS custom properties on the element itself (--sx / --sy) and the glow
 * is drawn by the .spotlight-card rule in globals.css, so React never
 * re-renders on mouse movement — the whole effect stays on the compositor.
 *
 * Touch devices never fire pointermove without a press, so they simply get
 * the plain card; nothing here depends on hover to read the content.
 */
export default function SpotlightCard({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--sy", `${e.clientY - rect.top}px`);
  }

  return (
    <div ref={ref} onPointerMove={onPointerMove} className={`spotlight-card ${className}`}>
      {children}
    </div>
  );
}
