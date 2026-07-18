import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import CaseShowcase from "@/components/work/CaseShowcase";
import { WORK_CASES } from "@/lib/work-data";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Case Studies: Real Results in SEO, Ads, AI & Development",
  description:
    "Client case studies from DigiSutra Solutions — 4.2× e-commerce revenue, 3× qualified fintech leads, AI concierges booking after-hours tours. The work, the numbers, the timeframes.",
  alternates: { canonical: `${SITE_URL}/work` },
};

const STATS = [
  { value: "250+", label: "projects shipped" },
  { value: "120+", label: "happy clients" },
  { value: "12", label: "countries served" },
  { value: "5.8×", label: "average ROAS" },
];

export default function WorkPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Work", item: `${SITE_URL}/work` },
        ],
      },
      {
        "@type": "ItemList",
        name: "DigiSutra Solutions case studies",
        itemListElement: WORK_CASES.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${c.client} — ${c.title}`,
          url: `${SITE_URL}/work`,
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
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
              Selected work
            </p>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
              Proof, not{" "}
              <span className="font-serif-accent font-medium italic text-orange-600">
                promises
              </span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-stone-600 sm:text-base">
              Every engagement below shipped on time and moved a number the
              client&rsquo;s CFO cares about — revenue, qualified leads, bookings
              or cost. The challenge, the work and the timeframe are all here.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-4 sm:grid-cols-4 lg:gap-x-8">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="font-display text-2xl font-extrabold tracking-tight text-stone-900">
                  {s.value}
                </p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
      <div className="mt-10">
        <CaseShowcase cases={WORK_CASES} />
      </div>
    </section>
  );
}
