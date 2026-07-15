"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { Award } from "lucide-react";
import { CERTS, STATS } from "@/lib/data";

function Counter({
  value,
  decimals = 0,
  start,
}: {
  value: number;
  decimals?: number;
  start: boolean;
}) {
  const [display, setDisplay] = useState(start ? value : 0);

  useEffect(() => {
    if (!start) return;
    let raf = 0;
    let t0: number | null = null;
    const duration = 1800;
    const step = (ts: number) => {
      if (t0 === null) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [start, value]);

  return <>{display.toFixed(decimals)}</>;
}

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  return (
    <section id="results" ref={ref} className="mx-auto max-w-[1280px] px-6 pt-20 sm:pt-24">
      <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <p className="font-display text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
              {reduced ? (
                stat.value.toFixed(stat.decimals ?? 0)
              ) : (
                <Counter
                  value={stat.value}
                  decimals={stat.decimals ?? 0}
                  start={animate}
                />
              )}
              <span className="text-orange-500">{stat.suffix}</span>
            </p>
            <p className="mt-1 text-sm text-stone-500">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
        {CERTS.map((cert) => (
          <span
            key={cert}
            className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600"
          >
            <Award size={14} className="text-orange-600" aria-hidden />
            {cert}
          </span>
        ))}
      </div>
    </section>
  );
}
