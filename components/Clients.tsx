import type { ReactNode } from "react";
import Reveal from "@/components/Reveal";

/* Styled text wordmarks — swap for real logo images when available. */
type Mark = { key: string; node: ReactNode; className?: string };

const ROW_A: Mark[] = [
  {
    key: "kart360",
    node: (
      <>
        KART<span className="text-[#F26419]">360</span>
      </>
    ),
    className: "font-extrabold",
  },
  {
    key: "medline",
    node: (
      <>
        Medline<span className="text-[#F26419]">+</span>
      </>
    ),
    className: "font-serif-accent text-lg font-bold",
  },
  { key: "agrolink", node: "AGROLINK", className: "font-bold tracking-[0.14em]" },
  { key: "finedge", node: "FinEdge", className: "font-bold italic" },
  { key: "zenpay", node: "zen_pay", className: "font-mono font-bold" },
];

const ROW_B: Mark[] = [
  { key: "urbannest", node: "URBANNEST", className: "font-bold tracking-[0.18em]" },
  {
    key: "trekyatra",
    node: "TrekYatra",
    className: "font-serif-accent text-lg italic",
  },
  {
    key: "novamed",
    node: (
      <>
        Nova<span className="text-[#F26419]">Med</span>
      </>
    ),
    className: "font-extrabold",
  },
  { key: "hexbuild", node: "⬡ HEXBUILD", className: "font-bold" },
  { key: "craftly", node: "craftly.io", className: "font-mono font-bold" },
];

const STATS = [
  { value: "120+", label: "happy clients" },
  { value: "12", label: "countries" },
  { value: "92%", label: "retention" },
  { value: "5.8×", label: "avg ROAS" },
];

function MarqueeRow({
  items,
  reverse,
  duration,
}: {
  items: Mark[];
  reverse?: boolean;
  duration: number;
}) {
  // Eight copies so the animation half (-50%) outspans even ultrawide
  // viewports now that the rows are full-bleed.
  const row = [...items, ...items, ...items, ...items, ...items, ...items, ...items, ...items];
  return (
    <div className="w-full overflow-hidden">
      <div
        className={`flex w-max items-center gap-3 hover:[animation-play-state:paused] ${
          reverse ? "animate-marquee-reverse" : "animate-marquee"
        }`}
        style={{ animationDuration: `${duration}s` }}
      >
        {row.map((m, i) => (
          <span
            key={`${m.key}-${i}`}
            aria-hidden={i >= items.length || undefined}
            className={`flex min-w-[150px] items-center justify-center whitespace-nowrap rounded-xl border border-[#F0E7DE] bg-white px-6 py-3.5 text-base text-stone-500 transition-colors hover:border-[#F26419] hover:text-[#F26419] ${m.className ?? ""}`}
          >
            {m.node}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Clients() {
  return (
    <section id="clients" className="overflow-x-clip pt-14 sm:pt-16">
      <Reveal>
        <div className="mx-auto max-w-[1280px] px-6 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
            Our clients
          </p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            Trusted by{" "}
            <span className="font-serif-accent font-medium italic text-orange-600">
              ambitious brands
            </span>
          </h2>
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="mt-10 space-y-3">
          <MarqueeRow items={ROW_A} duration={88} />
          <MarqueeRow items={ROW_B} reverse duration={104} />
        </div>
        <div className="mx-auto mt-8 flex max-w-[1280px] flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 text-sm text-stone-600">
          {STATS.map((s) => (
            <span key={s.label}>
              <b className="font-display font-extrabold text-[#F26419]">
                {s.value}
              </b>{" "}
              {s.label}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
