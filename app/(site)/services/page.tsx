import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ServicesIndex from "@/components/services/ServicesIndex";
import { getLiveServices } from "@/lib/services";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Digital Marketing & AI Services: SEO, Ads, Automation, Web & Apps",
  description:
    "Seven service lines, one growth partner: SEO + AI search (AEO/GEO), performance marketing, AI automation, websites, CRM, branding and mobile apps. From Noida, serving 12 countries.",
  alternates: { canonical: `${SITE_URL}/services` },
};

export default async function ServicesPage() {
  const services = await getLiveServices();
  const totalOffers = services.reduce((n, s) => n + s.offers.length, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Services", item: `${SITE_URL}/services` },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: services.map((s, i) => ({
          "@type": "Service",
          position: i + 1,
          name: s.name,
          description: s.blurb,
          url: `${SITE_URL}/services/${s.slug}`,
          provider: { "@type": "Organization", name: "DigiSutra Solutions" },
        })),
      },
    ],
  };

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
            Our services
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
            The full{" "}
            <span className="font-serif-accent font-medium italic text-orange-600">
              catalog
            </span>
          </h1>
        </div>
        <p className="text-sm text-stone-400">
          {String(services.length).padStart(2, "0")} services · {totalOffers} capabilities
        </p>
      </div>

      <ServicesIndex services={services} />

      <div className="mt-12 flex flex-col items-center gap-3 rounded-[2rem] bg-[#FFF6EF] px-6 py-10 text-center">
        <h2 className="font-display text-2xl font-extrabold text-stone-900">
          Not sure where to start?
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-stone-600">
          Book a free 30-minute expert call — a strategist tells you exactly
          which of these will move your numbers first, backed by a free
          15-page audit of your site.
        </p>
        <Link
          href="/contact"
          className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#F26419] px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600"
        >
          Claim your free expert call <ArrowRight size={15} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
