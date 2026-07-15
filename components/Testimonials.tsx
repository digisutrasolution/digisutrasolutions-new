"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { TESTIMONIALS } from "@/lib/data";

const ROTATE_MS = 6000;

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();

  const go = (next: number) =>
    setIndex(((next % TESTIMONIALS.length) + TESTIMONIALS.length) % TESTIMONIALS.length);

  useEffect(() => {
    if (paused || reduced) return;
    const t = setTimeout(() => go(index + 1), ROTATE_MS);
    return () => clearTimeout(t);
  }, [index, paused, reduced]);

  const t = TESTIMONIALS[index];
  const initials = t.name
    .split(" ")
    .map((w) => w[0])
    .join("");

  return (
    <section
      className="mx-auto max-w-[1280px] px-6 pt-20 sm:pt-24"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-3xl bg-orange-50 px-7 py-10 sm:px-12 sm:py-14">
        <span className="animate-aurora absolute -right-16 -top-16 h-56 w-56 rounded-full bg-orange-200 opacity-70 blur-[50px]" />
        <div className="relative">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
            What clients say
          </p>
          <div className="min-h-40 sm:min-h-32">
            <AnimatePresence mode="wait" initial={false}>
              <motion.figure
                key={index}
                initial={reduced ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -14 }}
                transition={{ duration: 0.4 }}
              >
                <div
                  className="flex gap-1 text-orange-500"
                  aria-label={`${t.rating} out of 5 stars`}
                >
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" aria-hidden />
                  ))}
                </div>
                <blockquote className="font-serif-accent mt-4 max-w-2xl text-lg italic leading-relaxed text-stone-800 sm:text-xl">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="font-display flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white">
                    {initials}
                  </span>
                  <span>
                    <span className="font-display block text-sm font-bold text-stone-900">
                      {t.name}
                    </span>
                    <span className="block text-xs text-stone-500">
                      {t.role}
                    </span>
                  </span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>
          <div className="mt-7 flex items-center justify-between">
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  aria-label={`Go to testimonial ${i + 1}`}
                  className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 ${
                    i === index
                      ? "w-8 bg-orange-600"
                      : "w-3 bg-orange-200 hover:bg-orange-400"
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => go(index - 1)}
                aria-label="Previous testimonial"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-orange-200 bg-white text-stone-700 transition-colors hover:border-orange-600 hover:bg-orange-600 hover:text-white"
              >
                <ArrowLeft size={15} aria-hidden />
              </button>
              <button
                onClick={() => go(index + 1)}
                aria-label="Next testimonial"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-orange-200 bg-white text-stone-700 transition-colors hover:border-orange-600 hover:bg-orange-600 hover:text-white"
              >
                <ArrowRight size={15} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
