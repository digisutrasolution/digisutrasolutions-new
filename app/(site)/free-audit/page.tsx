import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Check,
  Clock,
  FileSearch,
  Gauge,
  MousePointerClick,
  Search,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import AuditForm from "@/components/AuditForm";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { SITE_URL } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Free 15-Page Website Audit Report — Delivered in 48 Hours",
  description:
    "Request a free 15-page audit of your website: SEO and AI-search gaps, Core Web Vitals, mobile UX, conversion leaks and a competitor snapshot. No sales call required.",
  alternates: { canonical: `${SITE_URL}/free-audit` },
};

const WA_HREF =
  "https://wa.me/919953900123?text=" +
  encodeURIComponent("Hi DigiSutra! I'd like the free 15-page website audit.");

const SECTIONS = [
  {
    icon: Search,
    title: "SEO and AI search",
    copy: "Keyword and intent gaps, on-page issues, indexation problems, and whether your pages are structured to be quoted in AI Overviews.",
  },
  {
    icon: Gauge,
    title: "Speed and Core Web Vitals",
    copy: "LCP, CLS and INP measured on real page loads, with the specific assets and scripts costing you the most time.",
  },
  {
    icon: Smartphone,
    title: "Mobile experience",
    copy: "How the site behaves on a mid-range Android on 4G — the device most of your Indian traffic actually arrives on.",
  },
  {
    icon: MousePointerClick,
    title: "Conversion leaks",
    copy: "Where enquiries are being lost: form friction, unclear CTAs, missing trust signals, dead ends in the journey.",
  },
  {
    icon: Users,
    title: "Competitor snapshot",
    copy: "Three competitors ranking above you, what they cover that you do not, and which gaps are realistically winnable.",
  },
  {
    icon: BarChart3,
    title: "A prioritised fix list",
    copy: "Every finding ranked by effort against impact, so you know what to do first — whether we do it or your team does.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Send your URL",
    copy: "Your name, a WhatsApp number and the site address. That is the whole form — no budget qualification, no 12-field questionnaire.",
  },
  {
    n: "02",
    title: "We run the audit",
    copy: "A strategist and an engineer go through the site by hand, backed by crawl, PageSpeed and search data. It is not an automated PDF.",
  },
  {
    n: "03",
    title: "Report in 48 hours",
    copy: "The 15-page report lands on WhatsApp or email. Read it, act on it, hand it to another agency — it is yours either way.",
  },
];

const PROMISES = [
  "No card, no signup, no obligation",
  "No sales call required to receive it",
  "Written by people, not a scanner",
  "Yours to keep and act on however you like",
];

export default function FreeAuditPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Free audit report",
            item: `${SITE_URL}/free-audit`,
          },
        ],
      },
      {
        "@type": "Service",
        name: "Free 15-page website audit report",
        serviceType: "Website audit",
        provider: { "@type": "Organization", name: "DigiSutra Solutions" },
        areaServed: "Worldwide",
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(jsonLd)}
      />
      <PageHero
        eyebrow="Free audit report"
        title="15 pages on what is"
        titleAccent="holding your site back"
        image="/audit-hero.jpg"
        intro="SEO and AI search, speed, mobile UX, conversion leaks and a competitor snapshot — read by hand, delivered in 48 hours, with no obligation to work with us."
      >
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-stone-300">
          <span className="flex items-center gap-1.5">
            <Clock size={15} className="text-[#F26419]" aria-hidden /> 48-hour turnaround
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-[#F26419]" aria-hidden /> No sales call
            required
          </span>
          <span className="flex items-center gap-1.5">
            <FileSearch size={15} className="text-[#F26419]" aria-hidden /> Free, always
          </span>
        </div>
      </PageHero>

      {/* Request form */}
      <section className="mx-auto max-w-[1280px] px-6 pt-12 sm:pt-16">
        <Reveal>
          <div className="bg-dots-light relative overflow-hidden rounded-[2rem] bg-[#F26419] px-6 py-12 sm:px-12 sm:py-14">
            <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-[1.2fr_1fr]">
              <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Request your{" "}
                  <span className="font-serif-accent font-medium italic text-orange-100">
                    audit report
                  </span>
                </h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-orange-50/90 sm:text-base">
                  Three fields. We reply on WhatsApp within a working day and
                  send the full report inside 48 hours.
                </p>
                <ul className="mt-6 grid max-w-md grid-cols-1 gap-2.5">
                  {PROMISES.map((p, i) => (
                    <Reveal key={p} delay={0.12 + i * 0.08} y={10}>
                      <li className="flex items-center gap-2 text-sm font-medium text-white">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25">
                          <Check size={12} strokeWidth={3} aria-hidden />
                        </span>
                        {p}
                      </li>
                    </Reveal>
                  ))}
                </ul>
              </div>
              <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
                <AuditForm />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* What is inside */}
      <section className="mx-auto max-w-[1280px] px-6 pt-16 sm:pt-20">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
            What is inside
          </p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            Six sections,{" "}
            <span className="font-serif-accent font-medium italic text-orange-600">
              no filler
            </span>
          </h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s, i) => (
            <Reveal key={s.title} delay={(i % 3) * 0.06}>
              <div className="group h-full rounded-2xl border border-stone-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#F26419] hover:shadow-[0_16px_40px_rgba(28,25,23,0.08)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition-colors duration-300 group-hover:bg-[#F26419] group-hover:text-white">
                  <s.icon size={20} aria-hidden />
                </span>
                <h3 className="font-display mt-4 text-base font-bold text-stone-900">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{s.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-[1280px] px-6 pt-16 sm:pt-20">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
            How it works
          </p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            URL today,{" "}
            <span className="font-serif-accent font-medium italic text-orange-600">
              report in 48 hours
            </span>
          </h2>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08}>
              <div className="h-full rounded-2xl border border-stone-200 bg-white p-6">
                <p className="font-display text-3xl font-extrabold text-orange-200">
                  {s.n}
                </p>
                <h3 className="font-display mt-2 text-base font-bold text-stone-900">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{s.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Honest note + WhatsApp */}
      <section className="mx-auto max-w-[1280px] px-6 pb-16 pt-16 sm:pb-24 sm:pt-20">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-stone-900 p-8 sm:p-10 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <h2 className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                Why we give this away
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-400">
                Most sites have three or four fixable problems costing real
                money, and owners rarely get told what they are without signing
                something first. We would rather show our work. If the report is
                useful and you want help, the conversation starts from there —
                and if you take it to another agency, that is fine too.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <a
                href={WA_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#F26419] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600"
              >
                Ask on WhatsApp
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-stone-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:border-[#F26419] hover:text-[#FDBA74]"
              >
                Talk to a human
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
