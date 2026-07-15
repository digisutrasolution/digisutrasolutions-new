import Link from "next/link";
import { Check } from "lucide-react";
import Reveal from "@/components/Reveal";
import { PRICING } from "@/lib/data";

export default function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-[1280px] px-6 pt-20 sm:pt-24">
      <Reveal>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
          Pricing
        </p>
        <h2 className="font-display max-w-xl text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
          Plans that{" "}
          <span className="font-serif-accent font-medium italic text-orange-600">
            pay for
          </span>{" "}
          themselves
        </h2>
      </Reveal>
      <div className="mt-10 grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
        {PRICING.map((plan, i) => {
          const card = (
            <div
              className={`flex h-full flex-col rounded-3xl p-7 ${
                plan.featured
                  ? "bg-white"
                  : "border border-stone-200 bg-white transition-transform duration-300 hover:-translate-y-1.5"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-stone-900">
                  {plan.name}
                </h3>
                {plan.featured && (
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
                    Most popular
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-stone-500">{plan.tagline}</p>
              <p className="font-display mt-5 text-4xl font-extrabold tracking-tight text-stone-900">
                {plan.price}
                <span className="text-base font-semibold text-stone-400">
                  {plan.period}
                </span>
              </p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-stone-600">
                    <Check size={15} className="mt-0.5 shrink-0 text-orange-600" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className={`mt-7 block rounded-full py-3 text-center text-sm font-semibold transition-transform duration-300 hover:-translate-y-0.5 ${
                  plan.featured
                    ? "animate-shimmer bg-[linear-gradient(120deg,#EA580C,#FB923C,#EA580C)] text-white"
                    : "border border-stone-300 text-stone-900 hover:border-orange-500 hover:text-orange-700"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          );

          return (
            <Reveal key={plan.name} delay={i * 0.07}>
              {plan.featured ? (
                <div className="animate-gradient-pan h-full rounded-3xl bg-[linear-gradient(120deg,#F97316,#FBBF24,#EA580C,#F97316)] p-[2px]">
                  {card}
                </div>
              ) : (
                card
              )}
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
