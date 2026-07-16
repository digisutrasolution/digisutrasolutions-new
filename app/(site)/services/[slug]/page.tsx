import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createElement } from "react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { navIcon } from "@/components/nav-icons";
import { withBase } from "@/lib/base-path";
import { getLiveService, getLiveServices } from "@/lib/services";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getLiveService(slug);
  if (!service) return {};
  return {
    title: `${service.name} — India & Worldwide`,
    description: service.blurb,
    alternates: { canonical: `${SITE_URL}/services/${service.slug}` },
  };
}

export default async function ServiceCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [service, all] = await Promise.all([getLiveService(slug), getLiveServices()]);
  if (!service) notFound();
  const others = all.filter((s) => s.slug !== service.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Services", item: `${SITE_URL}/services` },
          { "@type": "ListItem", position: 3, name: service.name, item: `${SITE_URL}/services/${service.slug}` },
        ],
      },
      {
        "@type": "Service",
        name: service.name,
        description: service.intro,
        url: `${SITE_URL}/services/${service.slug}`,
        provider: { "@type": "Organization", name: "DigiSutra Solutions" },
        areaServed: "IN",
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: service.name,
          itemListElement: service.offers.map((o) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: o.name, description: o.blurb },
          })),
        },
      },
    ],
  };

  return (
    <section className="mx-auto max-w-[1280px] px-6 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/services"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 transition-colors hover:text-orange-700"
      >
        <ArrowLeft size={14} aria-hidden /> All services
      </Link>

      {/* Duotone hero */}
      <div className="relative mt-6 overflow-hidden rounded-[2rem] bg-stone-900">
        {service.image && (
          <>
            <Image
              src={withBase(service.image)}
              alt=""
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
            />
            <span className="absolute inset-0 bg-[#F26419]/25 mix-blend-color" aria-hidden />
            <span className="absolute inset-0 bg-[linear-gradient(100deg,rgba(18,10,5,0.92),rgba(18,10,5,0.55)_55%,rgba(18,10,5,0.25))]" aria-hidden />
          </>
        )}
        <div className="relative px-6 py-12 sm:px-12 sm:py-16 lg:max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#FDBA74]">
              {createElement(navIcon(service.icon), { size: 20 })}
            </span>
            {service.badge && (
              <span className="rounded-full bg-[#FFE3CC] px-2.5 py-1 text-[10px] font-bold text-orange-950">
                {service.badge}
              </span>
            )}
          </div>
          <h1 className="font-display mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {service.name}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-stone-300">{service.intro}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-[#F26419] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
            >
              Get my free audit <ArrowRight size={14} aria-hidden />
            </Link>
            {service.priceFrom && (
              <span className="text-sm text-stone-300">
                <b className="font-bold text-emerald-400">{service.priceFrom}</b>
                {service.marketNote && (
                  <span className="text-stone-500"> · {service.marketNote}</span>
                )}
              </span>
            )}
          </div>
        </div>
        {service.stat && (
          <div className="absolute right-8 top-8 hidden text-right lg:block">
            <span className="font-display block text-3xl font-extrabold text-emerald-400">{service.stat}</span>
            <span className="block text-xs text-stone-400">{service.statLabel}</span>
          </div>
        )}
      </div>

      {/* Offers */}
      <h2 className="font-display mt-12 text-2xl font-extrabold tracking-tight text-stone-900">
        What&rsquo;s{" "}
        <span className="font-serif-accent font-medium italic text-orange-600">included</span>
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {service.offers.map((o) => (
          <div
            key={o.name}
            className={`rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 ${
              o.highlight
                ? "border-[#F26419] bg-[#FFF7F0]"
                : "border-stone-200 bg-white hover:border-orange-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {o.highlight && <Sparkles size={14} className="text-[#F26419]" aria-hidden />}
              <h3 className="font-display font-bold text-stone-900">{o.name}</h3>
            </div>
            {o.blurb && (
              <p className="mt-1.5 text-sm leading-relaxed text-stone-500">{o.blurb}</p>
            )}
          </div>
        ))}
      </div>

      {/* Other services */}
      <div className="mt-14 border-t border-stone-200 pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-800">
          More from the catalog
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {others.map((s) => (
            <Link
              key={s.slug}
              href={`/services/${s.slug}`}
              className="group flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:border-[#F26419] hover:text-orange-700"
            >
              {createElement(navIcon(s.icon), { size: 13 })}
              {s.name}
              <ArrowRight size={12} aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
