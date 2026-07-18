import type { Metadata } from "next";
import Link from "next/link";
import { createElement } from "react";
import {
  ArrowRight,
  ChartLine,
  Earth,
  FileSearch,
  PauseCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import PricingMatrix from "@/components/pricing/PricingMatrix";
import { navIcon } from "@/components/nav-icons";
import { getLiveFaqs } from "@/lib/faq";
import { getLivePricing } from "@/lib/pricing";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing: Digital Marketing Plans & Rates in India",
  description:
    "Transparent, market-checked pricing: plans from ₹19,999/month, plus per-service rates for SEO, ads, AI automation, websites and apps. Pause anytime; free audit first.",
  alternates: { canonical: `${SITE_URL}/pricing` },
};

const TRUST = [
  { icon: Users, label: "120+ clients" },
  { icon: Earth, label: "12 countries" },
  { icon: ChartLine, label: "5.8× avg ROAS" },
  { icon: ShieldCheck, label: "No lock-in" },
];

export default async function PricingPage() {
  const [{ plans, matrix, rateCard }, allFaqs] = await Promise.all([
    getLivePricing(),
    getLiveFaqs(),
  ]);
  const pricingFaqs = allFaqs
    .filter((f) => f.category === "Pricing & engagement")
    .slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Pricing", item: `${SITE_URL}/pricing` },
        ],
      },
      ...plans
        .filter((p) => /\d/.test(p.price))
        .map((p) => ({
          "@type": "Offer",
          name: `${p.name} plan`,
          description: p.tagline,
          priceCurrency: "INR",
          price: p.price.replace(/[^\d]/g, ""),
          url: `${SITE_URL}/pricing`,
          offeredBy: { "@type": "Organization", name: "DigiSutra Solutions" },
        })),
    ],
  };

  return (
    <div className="pb-12 sm:pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Dark hero */}
      <div className="bg-stone-900">
        <div className="mx-auto max-w-[1280px] px-6 pb-14 pt-10 text-center sm:pb-16 sm:pt-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#FDBA74]">
            Pricing
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Pick a plan.{" "}
            <span className="font-serif-accent font-medium italic text-[#F26419]">
              Pause anytime.
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-stone-400 sm:text-base">
            Every price below is benchmarked against 2026 India agency rates —
            what the market charges is printed right next to what we charge, so
            you can compare without asking for a single quote.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
            {TRUST.map((t) => (
              <span
                key={t.label}
                className="flex items-center gap-1.5 rounded-full border border-stone-700 bg-stone-800/60 px-3.5 py-1.5 text-xs font-semibold text-stone-200"
              >
                <t.icon size={13} className="text-[#FDBA74]" aria-hidden /> {t.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-[1280px] px-6">
        <div className="-mt-6">
          <PricingMatrix plans={plans} matrix={matrix} />
        </div>

        {/* Risk reversal */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-dashed border-stone-200 pt-6 text-sm text-stone-600">
          <span className="flex items-center gap-1.5">
            <PauseCircle size={15} className="text-[#F26419]" aria-hidden /> Pause with 30 days notice
          </span>
          <span className="flex items-center gap-1.5">
            <FileSearch size={15} className="text-[#F26419]" aria-hidden /> Free 15-page audit before you pay
          </span>
          <span className="flex items-center gap-1.5">
            <ChartLine size={15} className="text-[#F26419]" aria-hidden /> Avg client: 5.8× ROAS
          </span>
        </div>

        {/* Rate card */}
        <h2 className="font-display mt-16 text-center text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
          Buying one thing?{" "}
          <span className="font-serif-accent font-medium italic text-orange-600">
            Straight rates.
          </span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-stone-600">
          Every project runs on a fixed quote agreed before work starts — the
          grey line under each rate is what the Indian market charges for the
          same scope.
        </p>
        <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="grid lg:grid-cols-2">
            {rateCard.map((r, i) => (
              <div
                key={r.label}
                className={`flex items-center justify-between gap-6 border-t border-stone-100 px-6 py-4 transition-colors hover:bg-[#FFFBF7] ${
                  i === 0 ? "border-t-0" : ""
                } ${i === 1 ? "lg:border-t-0" : ""} ${
                  i % 2 === 1 ? "lg:border-l lg:border-l-stone-100" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-stone-900">{r.label}</p>
                  {r.marketNote && (
                    <p className="mt-0.5 text-xs text-stone-400">{r.marketNote}</p>
                  )}
                </div>
                <span className="font-display shrink-0 text-sm font-bold text-emerald-700">
                  {r.price}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing FAQs (admin-managed) */}
        {pricingFaqs.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-center text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
              Pricing questions,{" "}
              <span className="font-serif-accent font-medium italic text-orange-600">
                answered
              </span>
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {pricingFaqs.map((f) => (
                <div
                  key={f.question}
                  className="group flex gap-4 rounded-2xl border border-stone-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#F26419] hover:shadow-[0_16px_40px_rgba(28,25,23,0.08)]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition-colors duration-300 group-hover:bg-[#F26419] group-hover:text-white">
                    {createElement(navIcon(f.icon), { size: 18, "aria-hidden": true })}
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-bold text-stone-900 sm:text-base">
                      {f.question}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone-600">
                      <b className="font-semibold text-orange-800">{f.lead}</b> {f.rest}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-stone-600">
              <Link href="/faq" className="font-semibold text-[#F26419] hover:underline">
                See every question answered →
              </Link>
            </p>
          </div>
        )}

        <div className="mt-14 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-[#F26419] px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
          >
            Not sure? Start with the free audit <ArrowRight size={14} aria-hidden />
          </Link>
          <p className="mt-3 text-xs text-stone-400">
            48-hour turnaround · tells you exactly what to buy (and what not to)
          </p>
        </div>
      </section>
    </div>
  );
}
