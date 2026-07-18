import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createElement } from "react";
import { ArrowRight, ChartLine, Earth, ShieldCheck, Users } from "lucide-react";
import PricingMatrix from "@/components/pricing/PricingMatrix";
import { navIcon } from "@/components/nav-icons";
import { withBase } from "@/lib/base-path";
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
      {/* Dark hero — duotone planning photo under a heavy scrim */}
      <div className="relative overflow-hidden bg-stone-900">
        <Image
          src={withBase("/pricing-hero.jpg")}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <span className="absolute inset-0 bg-[#F26419]/25 mix-blend-color" aria-hidden />
        <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,10,5,0.93),rgba(18,10,5,0.84)_55%,rgba(18,10,5,0.93))]" aria-hidden />
        <div className="relative mx-auto max-w-[1280px] px-6 pb-14 pt-10 text-center sm:pb-16 sm:pt-12">
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
        {/* relative so the billing toggle paints above the hero's absolute
            image/scrim layers in the -mt-6 overlap zone. Matrix, risk strip
            and rate card live in the client component so the INR/USD toggle
            covers them all. */}
        <div className="relative -mt-6">
          <PricingMatrix plans={plans} matrix={matrix} rateCard={rateCard} />
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
            Claim your free expert call <ArrowRight size={14} aria-hidden />
          </Link>
          <p className="mt-3 text-xs text-stone-400">
            30 minutes with a growth strategist — leave with a clear plan, whether you hire us or not
          </p>
        </div>
      </section>
    </div>
  );
}
