"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useInView, useReducedMotion } from "framer-motion";
import { Check, Target } from "lucide-react";
import Reveal from "@/components/Reveal";
import { PROCESS_STEPS } from "@/lib/data";

const STEP_MS = 1150;
const CELEBRATE_MS = 3800;
const CONFETTI_COLORS = ["#F26419", "#FDBA74", "#FB923C", "#FFEDD5", "#C2410C"];

type ConfettiPiece = {
  left: number;
  top: number;
  w: number;
  h: number;
  color: string;
  duration: number;
  delay: number;
};

function makeConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, k) => ({
    left: 8 + Math.random() * 84,
    top: 4 + Math.random() * 30,
    w: 4 + Math.random() * 4,
    h: 6 + Math.random() * 5,
    color: CONFETTI_COLORS[k % CONFETTI_COLORS.length],
    duration: 0.9 + Math.random() * 0.9,
    delay: Math.random() * 0.4,
  }));
}

export default function Process() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { margin: "-120px" });
  const reduced = useReducedMotion();

  // -1 idle · 0..6 running that step · 7 celebrating, then loops back to 0.
  const [active, setActive] = useState(-1);
  const [paused, setPaused] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  const celebrating = active >= PROCESS_STEPS.length;

  useEffect(() => {
    if (reduced || !inView || paused) return;
    const t = setTimeout(
      () => setActive((a) => (a >= PROCESS_STEPS.length ? 0 : a + 1)),
      active === -1 ? 400 : celebrating ? CELEBRATE_MS : STEP_MS,
    );
    return () => clearTimeout(t);
  }, [active, paused, inView, reduced, celebrating]);

  useEffect(() => {
    if (!celebrating || reduced) return;
    const burst = () => setConfetti(makeConfetti(26));
    const t0 = setTimeout(burst, 0);
    const t1 = setTimeout(burst, 600);
    const t2 = setTimeout(() => setConfetti([]), CELEBRATE_MS - 300);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [celebrating, reduced]);

  return (
    <section ref={sectionRef} id="process" className="mt-20 overflow-hidden sm:mt-24">
      {/* Below lg the dark band is inset 24px with rounded corners so it
          matches every other card band on mobile; desktop stays full-bleed. */}
      <div className="mx-6 overflow-hidden rounded-[2rem] bg-stone-900 py-12 sm:py-20 lg:mx-0 lg:rounded-none">
      <div className="mx-auto max-w-[1280px] px-6">
        <Reveal>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-300">
            How we work
          </p>
          <h2 className="font-display max-w-xl text-3xl font-extrabold tracking-tight text-stone-50 sm:text-4xl">
            Seven steps.{" "}
            <span className="font-serif-accent font-medium italic text-orange-400">
              Zero
            </span>{" "}
            guesswork.
          </h2>
        </Reveal>
        {/* Phones: live timeline — every step visible as a slim row, the
            running one expands with copy + progress; same state machine. */}
        <div className="mt-10 sm:hidden">
          <ol className="ml-1.5 space-y-3 border-l-2 border-stone-700 pl-5">
            {PROCESS_STEPS.map((s, j) => {
              const done = reduced || celebrating || active > j;
              const running = !reduced && active === j;
              return (
                <li key={s.step} className="relative">
                  <span
                    className={`absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 transition-colors duration-300 ${
                      done
                        ? "border-green-400 bg-green-400/40"
                        : running
                          ? "border-[#F26419] bg-[#F26419]"
                          : "border-stone-600 bg-stone-800"
                    }`}
                    aria-hidden
                  />
                  {running ? (
                    <div className="-translate-y-0.5 rounded-xl border border-[#F26419] bg-stone-800 p-3.5 shadow-[0_10px_24px_rgba(242,100,25,0.2)]">
                      <p className="font-display text-sm font-bold text-stone-100">
                        <span className="text-orange-400">0{j + 1}</span> · {s.step}{" "}
                        <span className="text-[11px] font-semibold text-orange-300">
                          running…
                        </span>
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-stone-400">{s.copy}</p>
                      <div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-stone-700">
                        <span className="step-bar-run block h-full rounded-full bg-[#F26419]" />
                      </div>
                    </div>
                  ) : (
                    <p
                      className={`flex items-center gap-2 py-0.5 text-sm font-semibold ${
                        done ? "text-stone-300" : "text-stone-500"
                      }`}
                    >
                      {done ? (
                        <Check size={14} className="shrink-0 text-green-400" aria-hidden />
                      ) : (
                        <span className="font-display text-xs font-extrabold text-stone-600">
                          0{j + 1}
                        </span>
                      )}
                      {s.step}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
          {celebrating && !reduced && (
            <div className="congrats-pop mt-5 rounded-xl border border-[#F26419] bg-stone-800 px-4 py-3.5 text-center">
              <p className="font-display text-sm font-extrabold text-stone-50">
                <Target size={15} className="mr-1.5 inline text-[#F26419]" aria-hidden />
                Target hit — and compounding
              </p>
              <p className="mt-0.5 text-[11px] text-orange-300">
                The loop restarts — optimize → scale → report, every month
              </p>
            </div>
          )}
        </div>

        {/* Tablet and up: the animated pipeline card grid */}
        <div
          className="relative mt-12 hidden sm:block"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {PROCESS_STEPS.map((s, j) => {
              const done = reduced || celebrating || active > j;
              const running = !reduced && active === j;
              return (
                <div
                  key={s.step}
                  className={`relative rounded-2xl border p-4 transition-all duration-300 ${
                    running
                      ? "-translate-y-1.5 border-[#F26419] bg-stone-800 shadow-[0_14px_30px_rgba(242,100,25,0.25)]"
                      : "border-stone-700/70 bg-stone-800/60"
                  }`}
                >
                  {running && (
                    <span
                      className="absolute right-3 top-3 h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-600 border-t-[#F26419]"
                      aria-hidden
                    />
                  )}
                  <p className="font-display text-xl font-extrabold text-orange-500">
                    0{j + 1}
                  </p>
                  <h3 className="font-display mt-1 text-sm font-bold text-stone-100">
                    {s.step}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-stone-400">
                    {s.copy}
                  </p>
                  <p
                    className={`mt-2 text-[11px] font-semibold ${
                      done
                        ? "text-green-400"
                        : running
                          ? "text-orange-300"
                          : "text-stone-500"
                    }`}
                  >
                    {done ? "✓ done" : running ? "running…" : "queued"}
                  </p>
                  <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-stone-700">
                    <span
                      className={`block h-full rounded-full ${
                        done
                          ? "w-full bg-green-400"
                          : running
                            ? "step-bar-run bg-[#F26419]"
                            : "w-0 bg-[#F26419]"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className={`absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-stone-900/90 transition-opacity duration-300 ${
              celebrating && !reduced
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          >
            {confetti.map((p, k) => (
              <span
                key={k}
                aria-hidden
                className="confetti-piece absolute rounded-[2px]"
                style={{
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  width: p.w,
                  height: p.h,
                  backgroundColor: p.color,
                  animationDuration: `${p.duration}s`,
                  animationDelay: `${p.delay}s`,
                }}
              />
            ))}
            <div
              className={`rounded-2xl border border-[#F26419] bg-stone-800 px-8 py-6 text-center ${
                celebrating && !reduced ? "congrats-pop" : ""
              }`}
            >
              <Target size={30} className="mx-auto text-[#F26419]" aria-hidden />
              <p className="font-display mt-2 text-xl font-extrabold text-stone-50">
                Target hit — and compounding
              </p>
              <p className="mt-0.5 text-xs text-orange-300">
                The loop restarts — optimize → scale → report, every month
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-block rounded-full bg-[#F26419] px-5 py-2 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                Start your growth plan →
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center sm:mt-10">
          <Link
            href="/contact"
            className="shine-sweep inline-block rounded-full bg-[#F26419] px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Claim your free expert call →
          </Link>
        </div>
      </div>
      </div>
    </section>
  );
}
