import type { Metadata } from "next";
import Link from "next/link";
import { createElement } from "react";
import { ArrowRight } from "lucide-react";
import { navIcon } from "@/components/nav-icons";
import { slugifyHeading } from "@/lib/blog";
import { getLiveFaqs, groupFaqs } from "@/lib/faq";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQ: Pricing, SEO, Ads, Websites & AI Automation Answered",
  description:
    "Straight answers on agency pricing, SEO timelines, ad budgets, website costs, AI automation and how DigiSutra works — written so you can decide before you call.",
  alternates: { canonical: `${SITE_URL}/faq` },
};

const WA_HREF =
  "https://wa.me/919953900123?text=" +
  encodeURIComponent("Hi DigiSutra! I have a question about your services.");

/* Every Q&A stays permanently visible in the DOM — no accordions — so
   search engines and AI Overviews can lift the answer-first copy. */
export default async function FaqPage() {
  const faqs = await getLiveFaqs();
  const groups = groupFaqs(faqs);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "FAQ", item: `${SITE_URL}/faq` },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: `${f.lead} ${f.rest}` },
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
      <div className="max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
          FAQ
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
          Every question,{" "}
          <span className="font-serif-accent font-medium italic text-orange-600">
            answered straight
          </span>
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-stone-600 sm:text-base">
          Pricing, timelines, budgets and what actually happens after you get in
          touch — the answers below are the same ones we give on calls, so you
          can decide before you ever speak to us.
        </p>
      </div>

      {/* Category quick-jump */}
      <nav aria-label="FAQ categories" className="mt-8 flex flex-wrap gap-2">
        {groups.map((g) => (
          <a
            key={g.category}
            href={`#${slugifyHeading(g.category)}`}
            className="rounded-full border border-stone-200 bg-white px-4 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:border-[#F26419] hover:text-orange-700"
          >
            {g.category}
          </a>
        ))}
      </nav>

      {groups.map((g) => (
        <div
          key={g.category}
          id={slugifyHeading(g.category)}
          className="mt-12 scroll-mt-[calc(var(--topbar-h)+92px)]"
        >
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-stone-900">
            {g.category}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {g.faqs.map((f) => (
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
        </div>
      ))}

      {/* Still stuck */}
      <div className="mt-14 rounded-[2rem] bg-stone-900 px-6 py-10 text-center sm:px-12">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Question not on the list?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-stone-400">
          Message us on WhatsApp — a real human replies the same day. Or book a
          free 30-minute expert call and get answers specific to your business.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-[#F26419] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
          >
            Claim your free expert call <ArrowRight size={14} aria-hidden />
          </Link>
          <a
            href={WA_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-stone-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:border-[#F26419] hover:text-[#FDBA74]"
          >
            WhatsApp us
          </a>
        </div>
      </div>
    </section>
  );
}
