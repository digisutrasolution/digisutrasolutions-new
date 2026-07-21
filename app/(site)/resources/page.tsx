import type { Metadata } from "next";
import Link from "next/link";
import { createElement } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { navIcon } from "@/components/nav-icons";
import { TOOLS, TOOL_GROUPS, liveTools } from "@/lib/resources";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free Marketing & Business Tools",
  description:
    "Free tools from DigiSutra Solutions — an ROI calculator, SEO and local-listing checks, GST and invoicing helpers. No signup, no credit card.",
  alternates: { canonical: `${SITE_URL}/resources` },
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
          { "@type": "ListItem", position: 2, name: "Free tools", item: `${SITE_URL}/resources` },
        ],
      },
      {
        "@type": "ItemList",
        name: "DigiSutra free tools",
        itemListElement: live.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.name,
          url: `${SITE_URL}/resources/${t.slug}`,
        })),
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
            Free tools
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Tools you can use{" "}
            <span className="font-serif-accent font-medium italic text-[#F26419]">right now</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-stone-400 sm:text-base">
            No signup, no credit card. {live.length} live today and more landing every few weeks —
            built for Indian businesses and the teams that run them.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-[1280px] px-6">
        {TOOL_GROUPS.map((group, gi) => {
          const tools = TOOLS.filter((t) => t.group === group);
          if (tools.length === 0) return null;
          return (
            <div key={group} className={gi === 0 ? "mt-12" : "mt-14"}>
              <h2 className="font-display text-xl font-extrabold tracking-tight text-stone-900">
                {group}
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((t) => {
                  const isLive = t.status === "live";
                  return (
                    <Link
                      key={t.slug}
                      href={`/resources/${t.slug}`}
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

        <div className="mt-16 rounded-[2rem] bg-stone-900 px-6 py-10 text-center sm:px-12">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#FDBA74]">
            <Sparkles size={18} aria-hidden />
          </span>
          <h2 className="font-display mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Want the tool to do the work for you?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-stone-400">
            A strategist will run the numbers on your business in a free 30-minute call — and
            you&rsquo;ll get the 15-page audit either way.
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
