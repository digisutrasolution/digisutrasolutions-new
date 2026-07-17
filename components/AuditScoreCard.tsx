"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { Globe } from "lucide-react";

const SCORE = 58;
const SCORE_ROWS = [
  { label: "SEO health", score: 62, color: "#F59E0B" },
  { label: "Site speed", score: 41, color: "#DC2626" },
  { label: "UX & conversion", score: 55, color: "#F59E0B" },
];

/* 58/100 arc: r=34 → circumference ≈ 213.6 */
const RING_C = 2 * Math.PI * 34;

/* Audit preview card: ring draws + score counts up when scrolled into view,
   bars grow with stagger, the "after 6 months" note slides in last.
   Reduced motion renders the finished state immediately. */
export default function AuditScoreCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(0); // 0..1 count-up driver
  const started = useRef(false);

  const run = inView || reduced;

  useEffect(() => {
    if (!inView || reduced || started.current) return;
    started.current = true;
    const t0 = performance.now();
    const DURATION = 1300;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / DURATION);
      // ease-out cubic
      setProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced]);

  const p = reduced ? 1 : progress;
  const scoreNow = Math.round(SCORE * p);
  const ringOffset = RING_C * (1 - (SCORE / 100) * p);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-sm">
      <div className="rounded-2xl bg-white p-6 shadow-[0_30px_60px_rgba(124,45,18,0.35)] transition-transform duration-300 hover:-translate-y-1.5">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-3 text-sm text-stone-500">
          <Globe size={15} className="text-[#F26419]" aria-hidden />
          yourwebsite.com
          <span className="ml-auto text-xs font-semibold text-stone-400">
            audit preview
          </span>
        </div>
        <div className="mt-4 flex items-center gap-5">
          <svg viewBox="0 0 80 80" className="h-24 w-24 shrink-0" aria-hidden>
            <circle cx="40" cy="40" r="34" fill="none" stroke="#F5EDE4" strokeWidth="9" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#F26419"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={ringOffset}
              transform="rotate(-90 40 40)"
            />
            <text x="40" y="42" textAnchor="middle" fontSize="20" fontWeight="800" fill="#1C1917">
              {scoreNow}
            </text>
            <text x="40" y="55" textAnchor="middle" fontSize="8" fill="#78716C">
              /100
            </text>
          </svg>
          <div>
            <p className="font-display text-sm font-bold text-stone-900">Growth score</p>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              Where most websites sit before we get to work.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {SCORE_ROWS.map((r, i) => (
            <div key={r.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-stone-600">{r.label}</span>
                <span className="font-bold" style={{ color: r.color }}>
                  {Math.round(r.score * p)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-stone-100">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: run ? `${r.score}%` : "0%",
                    backgroundColor: r.color,
                    transition: reduced
                      ? undefined
                      : `width 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) ${0.25 + i * 0.15}s`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <p
          className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700"
          style={{
            opacity: run ? 1 : 0,
            transform: run ? "translateY(0)" : "translateY(8px)",
            transition: reduced
              ? undefined
              : "opacity 0.5s ease 1.2s, transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) 1.2s",
          }}
        >
          ✓ Average client score after 6 months:{" "}
          <b className="font-extrabold">89/100</b>
        </p>
      </div>
      <span className="animate-float-y absolute -top-3 right-2 rounded-full border border-white/60 bg-stone-900 px-3.5 py-1.5 text-xs font-semibold text-orange-300">
        15-page report · in 48 hours
      </span>
    </div>
  );
}
