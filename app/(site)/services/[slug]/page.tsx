import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createElement } from "react";
import { ArrowLeft, ArrowRight, Check, FileSearch } from "lucide-react";
import AdSlot from "@/components/blog/AdSlot";
import { navIcon } from "@/components/nav-icons";
import ServiceRail from "@/components/services/ServiceRail";
import { withBase } from "@/lib/base-path";
import { slugifyHeading } from "@/lib/blog";
import { getLiveService, getLiveServices } from "@/lib/services";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

/* Offers have no icon column — derive a rail icon from the name, falling
   back to the category icon. First match wins, so specific rules go first. */
const OFFER_ICON_RULES: [RegExp, string][] = [
  [/audit/i, "fileSearch"],
  [/whatsapp/i, "messageCircle"],
  [/chatbot|customer support|\bbot\b|\bai\b/i, "bot"],
  [/email|sms/i, "mail"],
  [/local seo|business profile|\bmap\b/i, "mapPin"],
  [/e-?commerce|store|shopping/i, "shoppingCart"],
  [/seo|search|keyword/i, "search"],
  [/linkedin|b2b/i, "briefcase"],
  [/meta|facebook|instagram|social/i, "share2"],
  [/ads|ppc|remarketing|performance/i, "trendingUp"],
  [/content|copy|blog/i, "penTool"],
  [/crm|pipeline|database/i, "database"],
  [/appointment|booking/i, "calendarDays"],
  [/dashboard|report/i, "chartColumn"],
  [/track/i, "chartLine"],
  [/speed/i, "timer"],
  [/maintenance/i, "wrench"],
  [/wordpress|website|web app|landing/i, "monitorSmartphone"],
  [/android|ios|flutter|react native|\bapps?\b/i, "smartphone"],
  [/logo|brand|identity|design|wireframe|ui\/ux/i, "palette"],
  [/video|reel/i, "clapperboard"],
  [/automation/i, "wandSparkles"],
  [/lead|strategy/i, "target"],
  [/sales/i, "trendingUp"],
];

function offerIcon(name: string, fallback: string) {
  for (const [re, icon] of OFFER_ICON_RULES) if (re.test(name)) return icon;
  return fallback;
}

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

  const sections = service.offers.map((o) => ({
    ...o,
    id: slugifyHeading(o.name),
    railIcon: offerIcon(o.name, service.icon),
  }));

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
          itemListElement: sections.map((o) => ({
            "@type": "Offer",
            url: `${SITE_URL}/services/${service.slug}#${o.id}`,
            itemOffered: {
              "@type": "Service",
              name: o.name,
              description: o.description ?? o.blurb,
            },
          })),
        },
      },
    ],
  };

  return (
    <section className="mx-auto max-w-[1280px] px-6 pb-16 pt-12 sm:pb-24 sm:pt-16">
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
              Claim your free expert call <ArrowRight size={14} aria-hidden />
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

      {/* Mobile quick-jump chips (the scrollspy rail is desktop-only) */}
      <nav
        aria-label="Jump to a service"
        className="-mx-6 mt-8 flex gap-2 overflow-x-auto px-6 pb-1 lg:hidden"
      >
        {sections.map((o) => (
          <a
            key={o.id}
            href={`#${o.id}`}
            className="shrink-0 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:border-[#F26419] hover:text-orange-700"
          >
            {o.name}
          </a>
        ))}
      </nav>

      {/* Rail + long-form sections */}
      <div className="mt-8 grid gap-10 lg:mt-14 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12">
        <article className="min-w-0 lg:order-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-800">
            What&rsquo;s included
          </p>
          {sections.map((o, i) => (
            <section
              key={o.id}
              id={o.id}
              className={`scroll-mt-[calc(var(--topbar-h)+92px)] ${
                i === 0 ? "mt-4" : "mt-10 border-t border-stone-200 pt-10"
              }`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-stone-900">
                  {o.name}
                </h2>
                {o.highlight && (
                  <span className="rounded-full bg-[#FFE3CC] px-2.5 py-1 text-[10px] font-bold text-orange-950">
                    Popular
                  </span>
                )}
              </div>
              {o.image && (
                <div className="relative mt-5 h-52 overflow-hidden rounded-2xl bg-stone-900 sm:h-60">
                  <Image
                    src={withBase(o.image)}
                    alt={o.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 760px"
                    className="object-cover"
                  />
                  <span className="absolute inset-0 bg-[#F26419]/25 mix-blend-color" aria-hidden />
                </div>
              )}
              <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-stone-600">
                {o.description ?? o.blurb}
              </p>
              {o.features && o.features.length > 0 && (
                <ul className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                  {o.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-stone-700">
                      <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Check size={11} strokeWidth={3} aria-hidden />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-4 py-2 text-xs font-bold text-stone-800 transition-colors hover:border-[#F26419] hover:text-orange-700"
                >
                  Get a quote <ArrowRight size={12} aria-hidden />
                </Link>
                {o.priceNote && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                    {o.priceNote}
                  </span>
                )}
              </div>
            </section>
          ))}
        </article>

        <aside className="lg:order-1">
          <div className="space-y-6 lg:sticky lg:top-[calc(var(--topbar-h)+88px)] lg:max-h-[calc(100vh-var(--topbar-h)-104px)] lg:overflow-y-auto lg:pr-1 lg:[scrollbar-width:thin]">
            <div className="hidden lg:block">
              <ServiceRail
                items={sections.map((o) => ({
                  id: o.id,
                  name: o.name,
                  icon: o.railIcon,
                  priceNote: o.priceNote,
                  highlight: o.highlight,
                }))}
              />
            </div>
            <AdSlot placement="SERVICE_SIDEBAR" />
            <div className="rounded-2xl bg-stone-900 p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-[#FDBA74]">
                <FileSearch size={17} aria-hidden />
              </span>
              <p className="font-display mt-3 font-bold text-white">
                Free 15-page {service.name.toLowerCase().includes("seo") ? "SEO" : "growth"} audit
              </p>
              <p className="mt-1 text-sm leading-relaxed text-stone-400">
                See exactly what&rsquo;s holding you back — delivered within 48 hours, no sales
                call required.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#F26419] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-orange-600"
              >
                Get my free audit <ArrowRight size={12} aria-hidden />
              </Link>
            </div>
          </div>
        </aside>
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
