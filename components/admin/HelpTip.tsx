"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CircleHelp } from "lucide-react";

/* Small inline "?" affordance. Click (or focus + Enter) reveals a short
   popover; Esc or an outside click dismisses it. Use it next to a field label
   or section heading to explain a single thing without cluttering the UI. */
export default function HelpTip({
  children,
  label = "What's this?",
  size = 14,
  className = "",
}: {
  children: React.ReactNode;
  label?: string;
  size?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={wrapRef} className={`relative inline-flex align-middle ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="inline-flex cursor-pointer text-stone-400 transition-colors hover:text-orange-600 dark:hover:text-orange-400"
      >
        <CircleHelp size={size} aria-hidden />
      </button>
      {open && (
        <span
          id={panelId}
          role="tooltip"
          className="absolute left-1/2 top-[calc(100%+8px)] z-50 w-64 -translate-x-1/2 rounded-xl border border-stone-200 bg-white p-3 text-xs font-normal leading-relaxed text-stone-600 shadow-xl dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
        >
          <span
            className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800"
            aria-hidden
          />
          {children}
        </span>
      )}
    </span>
  );
}
