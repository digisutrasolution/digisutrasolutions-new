"use client";

import { useEffect, useState } from "react";

type Heading = { id: string; text: string };

/* Sticky "On this page" rail with IntersectionObserver scroll-spy. */
export default function ArticleToc({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState(headings[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-140px 0px -60% 0px", threshold: 0 },
    );
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav
      aria-label="On this page"
      className="rounded-2xl border border-stone-200 bg-white p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-800">
        On this page
      </p>
      <ul className="mt-3 space-y-1">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`block border-l-2 py-1 pl-3 text-sm leading-snug transition-colors ${
                active === h.id
                  ? "border-[#F26419] font-semibold text-orange-700"
                  : "border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-800"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
