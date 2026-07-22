import type { Metadata } from "next";
import { ChartLine, FileSearch, ShieldCheck } from "lucide-react";
import CtaBand from "@/components/CtaBand";
import PageHero from "@/components/PageHero";
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
      <PageHero
        eyebrow="Free tool"
        title="Marketing ROI"
        titleAccent="calculator"
        image="/free-tools-hero.jpg"
        intro={`Move the sliders to see what a monthly budget could return in enquiries, orders and revenue — modelled on the ${ROAS_LOW}×–${ROAS_HIGH}× range our clients see over ${RAMP_MONTHS}, with every assumption on screen.`}
      />

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

        <CtaBand
          title="These numbers depend on your market"
          body="A 30-minute expert call replaces the estimate with a plan built on your data — channels, budget split and the timeline to get there."
        />
      </section>
    </div>
  );
}
