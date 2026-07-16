import type { Metadata } from "next";
import Link from "next/link";
import { ChartLine, FileSearch, PauseCircle } from "lucide-react";
import PricingMatrix from "@/components/pricing/PricingMatrix";
import { getLivePricing } from "@/lib/pricing";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing: Digital Marketing Plans & Rates in India",
  description:
    "Transparent, market-checked pricing: plans from ₹19,999/month, plus per-service rates for SEO, ads, AI automation, websites and apps. Pause anytime; free audit first.",
  alternates: { canonical: `${SITE_URL}/pricing` },
};

export default async function PricingPage() {
  const { plans, matrix, rateCard } = await getLivePricing();

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
        <div className="mx-auto max-w-[1280px] px-6 py-14 text-center sm:py-16">
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
            Benchmarked against 2026 India agency rates — what the market
            charges is printed right next to what we charge.
          </p>
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
        <h2 className="font-display mt-14 text-center text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
          Buying one thing?{" "}
          <span className="font-serif-accent font-medium italic text-orange-600">
            Straight rates.
          </span>
        </h2>
        <div className="mx-auto mt-6 max-w-3xl divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white px-6">
          {rateCard.map((r) => (
            <div key={r.label} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3.5">
              <span className="font-display text-sm font-bold text-stone-900">{r.label}</span>
              <span className="text-sm text-stone-700">
                {r.price}
                {r.marketNote && (
                  <span className="text-xs text-stone-400"> · {r.marketNote}</span>
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center rounded-full bg-[#F26419] px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
          >
            Not sure? Start with the free audit →
          </Link>
          <p className="mt-3 text-xs text-stone-400">
            48-hour turnaround · tells you exactly what to buy (and what not to)
          </p>
        </div>
      </section>
    </div>
  );
}
