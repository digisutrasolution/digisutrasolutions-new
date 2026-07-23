import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Briefcase,
  Building2,
  Cpu,
  Factory,
  GraduationCap,
  HeartPulse,
  Hotel,
  Landmark,
  Mail,
  MousePointerClick,
  PenTool,
  Rocket,
  Search,
  Share2,
  ShoppingCart,
  Target,
  TrendingUp,
  Truck,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import type { Section } from "@/lib/cms/sections";

/* Icon key → component. Keys match INDUSTRY_ICON_KEYS in lib/cms/sections.
   Every icon here was checked against this lucide version before import. */
const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  health: HeartPulse,
  education: GraduationCap,
  realEstate: Building2,
  manufacturing: Factory,
  ecommerce: ShoppingCart,
  it: Cpu,
  professional: Briefcase,
  hospitality: Hotel,
  finance: Landmark,
  logistics: Truck,
  startup: Rocket,
  search: Search,
  ppc: MousePointerClick,
  social: Share2,
  content: PenTool,
  email: Mail,
  ai: Bot,
  conversion: TrendingUp,
};

export default function IndustriesBlock({
  s,
}: {
  s: Extract<Section, { type: "industries" }>;
}) {
  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-16 sm:pt-20">
      <Reveal>
        {s.heading && (
          <h2 className="font-display max-w-3xl text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            {s.heading}{" "}
            {s.highlight && (
              <span className="font-serif-accent italic text-[#F26419]">
                {s.highlight}
              </span>
            )}
          </h2>
        )}
        {s.copy && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
            {s.copy}
          </p>
        )}
      </Reveal>

      {s.callout && (
        <Reveal>
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-stone-900 px-5 py-4 sm:items-center">
            <Target size={18} className="mt-0.5 shrink-0 text-[#FDBA74] sm:mt-0" aria-hidden />
            <p className="text-sm leading-relaxed text-stone-200">{s.callout}</p>
          </div>
        </Reveal>
      )}

      {s.items.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {s.items.map((item, i) => {
            const Icon = INDUSTRY_ICONS[item.icon];
            return (
              <Reveal key={i} delay={(i % 3) * 0.06}>
                <div className="h-full rounded-3xl border border-stone-200 bg-white p-6 transition-transform duration-300 hover:-translate-y-1.5">
                  {Icon && (
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[#F26419]">
                      <Icon size={21} aria-hidden />
                    </span>
                  )}
                  <h3 className="font-display mt-4 text-base font-bold text-stone-900">
                    {item.name}
                  </h3>
                  {item.blurb && (
                    <p className="mt-1.5 text-sm leading-relaxed text-stone-500">
                      {item.blurb}
                    </p>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      )}

      {s.channels.length > 0 && (
        <Reveal>
          <div className="mt-6 rounded-3xl bg-stone-900 px-6 py-8 sm:px-8">
            {s.channelsHeading && (
              <p className="font-condensed text-center text-xs font-bold uppercase tracking-[0.25em] text-[#FDBA74]">
                {s.channelsHeading}
              </p>
            )}
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-7">
              {s.channels.map((c, i) => {
                const Icon = INDUSTRY_ICONS[c.icon];
                return (
                  <li key={i} className="flex flex-col items-center gap-2 text-center">
                    {Icon && <Icon size={20} className="text-[#FDBA74]" aria-hidden />}
                    <span className="text-[11px] font-semibold uppercase leading-tight tracking-wide text-stone-300">
                      {c.name}
                    </span>
                  </li>
                );
              })}
            </ul>
            {s.goal && (
              <p className="mt-7 border-t border-stone-700 pt-5 text-center text-sm font-bold text-white">
                {s.goal}
              </p>
            )}
          </div>
        </Reveal>
      )}
    </section>
  );
}
