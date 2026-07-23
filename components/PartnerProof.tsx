"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Headphones,
  Receipt,
  Rocket,
  ShieldCheck,
  Users,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import type { Testimonial } from "@/lib/proof";

const REASONS: { icon: LucideIcon; label: string }[] = [
  { icon: Users, label: "Senior marketers & engineers on every account" },
  { icon: Receipt, label: "Fixed quotes — no surprise invoices" },
  { icon: Headphones, label: "Named account manager, same-day replies" },
  { icon: Rocket, label: "MVPs in weeks, not quarters" },
  { icon: ShieldCheck, label: "OWASP-secure, 95+ Lighthouse builds" },
  { icon: Bot, label: "AI baked into product and process" },
];

const TICK_MS = 1600;

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function PartnerProof({
  testimonials = [],
}: {
  testimonials?: Testimonial[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { margin: "-120px" });
  const reduced = useReducedMotion();
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduced || !inView || paused) return;
    const id = setTimeout(() => setTick((k) => k + 1), TICK_MS);
    return () => clearTimeout(id);
  }, [tick, reduced, inView, paused]);

  const active = reduced ? -1 : tick % REASONS.length;
  /* No real quotes yet -> no panel. Guarding on length keeps the modulo
     from producing NaN and the layout from rendering an empty card. */
  const hasQuotes = testimonials.length > 0;
  const t = reduced || !hasQuotes ? 0 : Math.floor(tick / 2) % testimonials.length;
  const quote = testimonials[t];

  return (
    <section
      ref={sectionRef}
      id="why-us"
      className="mx-auto max-w-[1280px] px-6 pt-20 sm:pt-24"
    >
      <Reveal>
        <div
          className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Why choose us — reasons take turns lighting up */}
          <div className="rounded-3xl border border-stone-200 bg-white p-7 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
              Why choose us
            </p>
            <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
              Built like a{" "}
              <span className="font-serif-accent font-medium italic text-orange-600">
                partner
              </span>
              , not a vendor
            </h2>
            <div className="mt-6 flex flex-col gap-2.5">
              {REASONS.map((r, j) => {
                const on = j === active;
                return (
                  <div
                    key={r.label}
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-all duration-300 ${
                      on
                        ? "translate-x-1 border-[#F26419] bg-[#FFF3E8]"
                        : "border-transparent"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${
                        on ? "bg-[#F26419] text-white" : "bg-orange-100 text-[#F26419]"
                      }`}
                    >
                      <r.icon size={15} aria-hidden />
                    </span>
                    <span className="text-sm text-stone-700">{r.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* What clients say — rotating quotes + retention ring */}
          {hasQuotes && quote && (
          <div className="relative flex flex-col overflow-hidden rounded-3xl bg-stone-900 p-7 sm:p-8">
            <span
              className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-[#F26419] opacity-25 blur-[32px]"
              aria-hidden
            />
            {/* Retention reads as a pill beside the label: the old ring sat
                on the rounded corner and clipped its own caption. */}
            <div className="relative flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-300">
                What clients say
              </p>
              <span className="shrink-0 rounded-full bg-[#F26419]/15 px-3 py-1 text-xs font-semibold text-[#FDBA74]">
                92% stay with us
              </span>
            </div>
            {/* The card stretches to the panel beside it, so the quote is
                centred in whatever height is left rather than leaving one
                large hole above the author. */}
            <div key={t} className="chat-pop relative flex flex-1 flex-col justify-center py-6">
              <p
                className="tracking-[0.2em] text-[#F26419]"
                aria-label={`${quote.rating} out of 5 stars`}
              >
                {"★".repeat(quote.rating)}
              </p>
              <blockquote className="font-serif-accent mt-3 text-lg font-medium italic leading-relaxed text-stone-100 sm:text-xl">
                &ldquo;{quote.quote}&rdquo;
              </blockquote>
            </div>
            <div className="relative flex items-center gap-3 border-t border-stone-800 pt-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F26419] text-sm font-bold text-white">
                {initials(quote.name)}
              </span>
              <span>
                <span className="block text-sm font-bold text-white">
                  {quote.name}
                </span>
                <span className="block text-xs text-stone-400">
                  {quote.role}
                </span>
              </span>
            </div>
            <div className="relative mt-5 flex gap-1.5" role="tablist" aria-label="Testimonials">
              {testimonials.map((tm, j) => (
                <button
                  key={tm.name}
                  role="tab"
                  aria-selected={j === t}
                  aria-label={`Show testimonial from ${tm.name}`}
                  onClick={() => setTick(j * 2)}
                  className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 ${
                    j === t ? "w-8 bg-[#F26419]" : "w-3 bg-stone-600 hover:bg-orange-400"
                  }`}
                />
              ))}
            </div>
          </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}
