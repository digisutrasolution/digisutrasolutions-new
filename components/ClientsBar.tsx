import type { ReactNode } from "react";
import Reveal from "@/components/Reveal";

/* Dark pre-footer trust band: ghost wordmarks on charcoal that flow into
   the footer's dark zone. Logos brighten and lift on hover; stats row
   sits under a hairline divider. Replaces the mid-page Clients section. */

type Mark = { key: string; node: ReactNode; className?: string };

const MARKS: Mark[] = [
  { key: "kart360", node: <>KART<span className="text-[#F26419]/60 transition-colors group-hover:text-[#F26419]">360</span></>, className: "font-extrabold" },
  { key: "medline", node: <>Medline<span className="text-[#F26419]/60 transition-colors group-hover:text-[#F26419]">+</span></>, className: "font-serif-accent text-lg font-bold" },
  { key: "agrolink", node: "AGROLINK", className: "font-bold tracking-[0.14em]" },
  { key: "finedge", node: "FinEdge", className: "font-bold italic" },
  { key: "zenpay", node: "zen_pay", className: "font-mono font-bold" },
  { key: "urbannest", node: "URBANNEST", className: "font-bold tracking-[0.18em]" },
  { key: "trekyatra", node: "TrekYatra", className: "font-serif-accent text-lg italic" },
  { key: "novamed", node: <>Nova<span className="text-[#F26419]/60 transition-colors group-hover:text-[#F26419]">Med</span></>, className: "font-extrabold" },
  { key: "hexbuild", node: "⬡ HEXBUILD", className: "font-bold" },
  { key: "craftly", node: "craftly.io", className: "font-mono font-bold" },
];

const STATS = [
  { value: "120+", label: "happy clients" },
  { value: "12", label: "countries" },
  { value: "92%", label: "retention" },
  { value: "5.8×", label: "avg ROAS" },
];

export default function ClientsBar() {
  return (
    <section aria-label="Trusted by our clients" className="bg-stone-900">
      <div className="mx-auto max-w-[1280px] px-6 py-14 sm:py-16">
        <Reveal>
          <div className="text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#F26419]">
              Our clients
            </p>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Trusted by{" "}
              <span className="font-serif-accent font-medium italic text-[#FDBA74]">
                ambitious brands
              </span>{" "}
              in 12 countries
            </h2>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {MARKS.map((m) => (
              <span
                key={m.key}
                className={`group cursor-default whitespace-nowrap text-base text-white/[0.38] transition-all duration-300 hover:-translate-y-0.5 hover:text-white ${m.className ?? ""}`}
              >
                {m.node}
              </span>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.18}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 border-t border-stone-800 pt-8">
            {STATS.map((s) => (
              <span key={s.label} className="text-sm text-stone-400">
                <b className="font-display mr-1.5 text-lg font-extrabold text-[#FDBA74]">
                  {s.value}
                </b>
                {s.label}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
