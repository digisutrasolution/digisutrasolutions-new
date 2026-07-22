import type { ReactNode } from "react";

/* Slim trust bar just above the footer: inline label, one compact wordmark
   marquee (clipped lane with edge fades, pause on hover), key stats right.
   Replaces the full Clients section that used to sit mid-page. */

type Mark = { key: string; node: ReactNode; className?: string };

/* Real client wordmarks only — a bar headed "Trusted by our clients"
   listing companies that are not clients is a false statement, not
   decoration. The whole bar hides while this is empty. */
const MARKS: Mark[] = [];

export default function ClientsBar() {
  if (MARKS.length === 0) return null;
  // Two copies per animation half so -50% loops seamlessly on ultrawide.
  const row = [...MARKS, ...MARKS, ...MARKS, ...MARKS];

  return (
    <div
      aria-label="Trusted by our clients"
      className="flex items-center border-t border-stone-200/70 bg-white"
    >
      <div className="hidden shrink-0 items-center gap-2 self-stretch border-r border-[#FFE3CC] bg-[#FFF6EF] px-5 sm:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-[#F26419]" aria-hidden />
        <span className="whitespace-nowrap text-[0.7rem] font-black uppercase tracking-[0.16em] text-orange-800">
          Our clients
        </span>
      </div>
      <div className="relative flex-1 overflow-hidden py-2.5">
        <div
          className="flex w-max items-center gap-2.5 hover:[animation-play-state:paused] animate-marquee"
          style={{ animationDuration: "70s" }}
        >
          {row.map((m, i) => (
            <span
              key={`${m.key}-${i}`}
              aria-hidden={i >= MARKS.length || undefined}
              className={`flex min-w-[110px] items-center justify-center whitespace-nowrap rounded-lg border border-[#F0E7DE] bg-white px-4 py-1.5 text-sm text-stone-500 transition-colors hover:border-[#F26419] hover:text-[#F26419] ${m.className ?? ""}`}
            >
              {m.node}
            </span>
          ))}
        </div>
        <span className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent" aria-hidden />
        <span className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent" aria-hidden />
      </div>
      <div className="hidden shrink-0 items-center gap-4 self-stretch border-l border-stone-200/70 bg-[#FAFAF9] px-5 lg:flex">
        <span className="whitespace-nowrap text-xs text-stone-600">
          <b className="font-display font-extrabold text-[#F26419]">120+</b> happy clients
        </span>
        <span className="whitespace-nowrap text-xs text-stone-600">
          <b className="font-display font-extrabold text-[#F26419]">12</b> countries
        </span>
        <span className="whitespace-nowrap text-xs text-stone-600">
          <b className="font-display font-extrabold text-[#F26419]">5.8×</b> avg ROAS
        </span>
      </div>
    </div>
  );
}
