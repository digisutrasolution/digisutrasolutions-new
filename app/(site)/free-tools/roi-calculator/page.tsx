import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChartLine, FileSearch, ShieldCheck } from "lucide-react";
import RoiCalculator from "@/components/RoiCalculator";
import { RAMP_MONTHS, ROAS_HIGH, ROAS_LOW } from "@/lib/roi";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Marketing ROI Calculator: Estimate Leads & Revenue",
  description:
    "Free ROI calculator for Indian businesses — move the sliders to see the enquiries, orders and revenue a monthly marketing budget could return, with the assumptions shown.",
  alternates: { canonical: `${SITE_URL}/free-tools/roi-calculator` },
};

export default function RoiCalculatorPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Resources", item: `${SITE_URL}/free-tools` },
          {
            "@type": "ListItem",
            position: 3,
            name: "ROI Calculator",
            item: `${SITE_URL}/free-tools/roi-calculator`,
          },
        ],
      },
      {
        "@type": "WebApplication",
        name: "DigiSutra Marketing ROI Calculator",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Any",
        url: `${SITE_URL}/free-tools/roi-calculator`,
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      },
    ],
  };

  return (
    <div className="pb-16 sm:pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="bg-stone-900">
        <div className="mx-auto max-w-[1280px] px-6 pb-14 pt-10 text-center sm:pb-16 sm:pt-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#FDBA74]">
            Free tool
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Marketing ROI{" "}
            <span className="font-serif-accent font-medium italic text-[#F26419]">calculator</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-stone-400 sm:text-base">
            Move the sliders to see what a monthly budget could return in
            enquiries, orders and revenue — modelled on the {ROAS_LOW}×–{ROAS_HIGH}× range our
            clients see over {RAMP_MONTHS}, with every assumption on screen.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-[1280px] px-6">
        <div className="-mt-6">
          <RoiCalculator />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-dashed border-stone-200 pt-6 text-sm text-stone-600">
          <span className="flex items-center gap-1.5">
            <ChartLine size={15} className="text-[#F26419]" aria-hidden /> Ranges, not promises
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-[#F26419]" aria-hidden /> No signup to use it
          </span>
          <span className="flex items-center gap-1.5">
            <FileSearch size={15} className="text-[#F26419]" aria-hidden /> Free 15-page audit to
            validate the numbers
          </span>
        </div>

        <div className="mt-14 rounded-[2rem] bg-stone-900 px-6 py-10 text-center sm:px-12">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            These numbers depend on your market
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-stone-400">
            A 30-minute expert call replaces the estimate with a plan built on your data —
            channels, budget split and the timeline to get there.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#F26419] px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600"
          >
            Claim your free expert call <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
