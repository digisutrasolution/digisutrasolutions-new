"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  animate,
  type Variants,
} from "framer-motion";
import type { Section } from "@/lib/cms/sections";

type CountriesSection = Extract<Section, { type: "countries" }>;

/* The count-up target: the editable `count` if it's a number, otherwise
   the number of flags. Falls back to the list length. */
function targetNumber(s: CountriesSection): number {
  const fromField = parseInt(s.count.replace(/[^\d]/g, ""), 10);
  if (Number.isFinite(fromField) && fromField > 0) return fromField;
  return s.countries.length;
}

/* Any non-digit suffix on `count` (e.g. the "+" in "12+") is kept and
   re-appended after the animated digits. */
function suffix(s: CountriesSection): string {
  const m = s.count.match(/[^\d\s]+$/);
  return m ? m[0] : "";
}

function CountUp({ to, suffix: suf }: { to: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    // duration 0 for reduced motion jumps straight to the value via the
    // onUpdate callback — no synchronous setState in the effect body.
    const controls = animate(mv, to, {
      duration: reduced ? 0 : 1.1,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to, reduced, mv]);

  return (
    <span ref={ref}>
      {display}
      {suf}
    </span>
  );
}

const grid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const chip: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function CountriesBlock({ s }: { s: CountriesSection }) {
  const reduced = useReducedMotion();
  const flags = s.countries.filter((c) => c.code);

  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-16 sm:pt-20">
      <div className="overflow-hidden rounded-3xl bg-stone-900 px-6 py-12 sm:px-10 sm:py-14">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
          <div>
            <p className="font-display text-6xl font-extrabold tracking-tight text-[#FDBA74] sm:text-7xl">
              <CountUp to={targetNumber(s)} suffix={suffix(s)} />
            </p>
            {s.heading && (
              <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {s.heading}
              </h2>
            )}
            {s.copy && (
              <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-400">
                {s.copy}
              </p>
            )}
          </div>

          <motion.ul
            variants={reduced ? undefined : grid}
            initial={reduced ? undefined : "hidden"}
            whileInView={reduced ? undefined : "show"}
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
          >
            {flags.map((c, i) => (
              <motion.li
                key={`${c.code}-${i}`}
                variants={reduced ? undefined : chip}
                className="flex items-center gap-2.5 rounded-xl border border-stone-700 bg-stone-800/60 px-3 py-2.5"
              >
                {/* flagcdn is allowed by the CSP; plain img avoids next/image
                    remote-domain config. Absolute URL, so no withBase(). */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                  srcSet={`https://flagcdn.com/w80/${c.code.toLowerCase()}.png 2x`}
                  width={24}
                  height={16}
                  loading="lazy"
                  alt={c.name ? `${c.name} flag` : ""}
                  className="h-4 w-6 shrink-0 rounded-[3px] object-cover ring-1 ring-white/10"
                />
                <span className="truncate text-xs font-semibold text-stone-200">
                  {c.name}
                </span>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}
