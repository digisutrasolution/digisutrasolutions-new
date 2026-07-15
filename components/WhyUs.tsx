import {
  Users,
  ReceiptText,
  Headphones,
  IterationCw,
  Rocket,
  ShieldCheck,
  Gauge,
  Bot,
  Layers,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import { WHY_US } from "@/lib/data";

const ICONS = {
  users: Users,
  receipt: ReceiptText,
  headset: Headphones,
  iterations: IterationCw,
  rocket: Rocket,
  shield: ShieldCheck,
  gauge: Gauge,
  bot: Bot,
  layers: Layers,
} as const;

export default function WhyUs() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-20 sm:pt-24">
      <Reveal>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
          Why choose us
        </p>
        <h2 className="font-display max-w-xl text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
          Built like a{" "}
          <span className="font-serif-accent font-medium italic text-orange-600">
            partner
          </span>
          , not a vendor
        </h2>
      </Reveal>
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WHY_US.map((item, i) => {
          const Icon = ICONS[item.icon as keyof typeof ICONS];
          return (
            <Reveal key={item.title} delay={(i % 3) * 0.06}>
              <div className="group flex h-full items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-orange-300">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700 transition-colors duration-300 group-hover:bg-orange-600 group-hover:text-white">
                  <Icon size={16} aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-sm font-bold text-stone-900">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-stone-500">
                    {item.copy}
                  </p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
