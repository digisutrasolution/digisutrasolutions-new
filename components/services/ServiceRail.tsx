"use client";

import { createElement, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { navIcon } from "@/components/nav-icons";

export type RailItem = {
  id: string;
  name: string;
  icon: string;
  priceNote?: string;
  highlight?: boolean;
};

/* Scrollspy rail for the service detail page: highlights the section being
   read (IntersectionObserver band around the upper third of the viewport)
   and smooth-scrolls on click. Sections carry scroll-mt for the fixed
   header, so native hash navigation lands correctly too. */
export default function ServiceRail({ items }: { items: RailItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        const current = items.find((i) => visible.has(i.id));
        if (current) setActive(current.id);
      },
      { rootMargin: "-30% 0px -55% 0px" },
    );
    for (const i of items) {
      const el = document.getElementById(i.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [items]);

  const jump = (id: string) => (e: React.MouseEvent) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    history.replaceState(null, "", `#${id}`);
    setActive(id);
  };

  return (
    <nav aria-label="Services on this page">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-800">
        On this page
      </p>
      <ul className="mt-3 space-y-1.5">
        {items.map((i) => {
          const on = i.id === active;
          return (
            <li key={i.id}>
              <a
                href={`#${i.id}`}
                onClick={jump(i.id)}
                aria-current={on ? "true" : undefined}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors ${
                  on
                    ? "border-[#F26419] bg-[#FFF7F0]"
                    : "border-transparent hover:border-orange-200 hover:bg-orange-50/60"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    on ? "bg-[#F26419] text-white" : "bg-orange-100/80 text-orange-700"
                  }`}
                >
                  {createElement(navIcon(i.icon), { size: 15, "aria-hidden": true })}
                </span>
                <span className="min-w-0">
                  <span
                    className={`flex items-center gap-1.5 text-sm font-semibold ${
                      on ? "text-orange-900" : "text-stone-700"
                    }`}
                  >
                    <span className="truncate">{i.name}</span>
                    {i.highlight && (
                      <Sparkles size={12} className="shrink-0 text-[#F26419]" aria-hidden />
                    )}
                  </span>
                  {i.priceNote && (
                    <span className="block truncate text-[11px] text-stone-400">{i.priceNote}</span>
                  )}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
