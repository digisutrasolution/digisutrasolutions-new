import type { Metadata } from "next";
import Link from "next/link";
import { createElement } from "react";
import { ArrowRight } from "lucide-react";
import CtaBand from "@/components/CtaBand";
import PageHero from "@/components/PageHero";
import { navIcon } from "@/components/nav-icons";
import { TOOLS, TOOL_GROUPS, liveTools } from "@/lib/free-tools";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free Marketing & Business Tools",
  description:
    "Free tools from DigiSutra Solutions — an ROI calculator, SEO and local-listing checks, GST and invoicing helpers. No signup, no credit card.",
  alternates: { canonical: `${SITE_URL}/free-tools` },
};

export default function ResourcesPage() {
  const live = liveTools();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Free tools", item: `${SITE_URL}/free-tools` },
        ],
      },
      {
        "@type": "ItemList",
        name: "DigiSutra free tools",
        itemListElement: live.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.name,
          url: `${SITE_URL}/free-tools/${t.slug}`,
        })),
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHero
        eyebrow="Free tools"
        title="Tools you can use"
        titleAccent="right now"
        image="/free-tools-hero.jpg"
        intro={`No signup, no credit card. All ${live.length} are live today — built for Indian businesses and the teams that run them.`}
      />

      <section className="mx-auto max-w-[1280px] px-6 py-12 sm:py-16">
        {TOOL_GROUPS.map((group, gi) => {
          const tools = TOOLS.filter((t) => t.group === group);
          if (tools.length === 0) return null;
          return (
            <div key={group} className={gi === 0 ? "" : "mt-14"}>
              <h2 className="font-display text-xl font-extrabold tracking-tight text-stone-900">
                {group}
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((t) => {
                  const isLive = t.status === "live";
                  return (
                    <Link
                      key={t.slug}
                      href={`/free-tools/${t.slug}`}
                      className={`group rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 ${
                        isLive
                          ? "border-stone-200 bg-white hover:border-[#F26419] hover:shadow-[0_16px_40px_rgba(28,25,23,0.08)]"
                          : "border-dashed border-stone-200 bg-[#FFFBF7] hover:border-stone-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                            isLive
                              ? "bg-orange-50 text-orange-600 group-hover:bg-[#F26419] group-hover:text-white"
                              : "bg-stone-100 text-stone-400"
                          }`}
                        >
                          {createElement(navIcon(t.icon), { size: 18, "aria-hidden": true })}
                        </span>
                        {isLive ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                            Live
                          </span>
                        ) : (
                          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-500">
                            In the works
                          </span>
                        )}
                      </div>
                      <h3 className="font-display mt-3.5 text-base font-bold text-stone-900">
                        {t.name}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-stone-500">{t.blurb}</p>
                      {isLive && (
                        <p className="mt-3 flex items-center gap-1.5 text-sm font-bold text-[#F26419]">
                          Open tool
                          <ArrowRight
                            size={13}
                            aria-hidden
                            className="transition-transform duration-300 group-hover:translate-x-0.5"
                          />
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        <CtaBand
          className="mt-12 sm:mt-16"
          title="Want the tool to do the work for you?"
          body="A strategist will run the numbers on your business in a free 30-minute call — and you'll get the 15-page audit either way."
        />
      </section>
    </div>
  );
}
