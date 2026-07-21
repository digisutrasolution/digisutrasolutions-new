import Link from "next/link";
import { createElement } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { navIcon } from "@/components/nav-icons";
import { findTool, liveTools } from "@/lib/free-tools";
import { SITE_URL } from "@/lib/site";

/* Shared chrome for every live free tool: hero, the tool itself, sibling
   tools and one CTA — so each tool page is consistent and each ships
   WebApplication + breadcrumb schema without repeating the markup. */
export default function ToolShell({
  slug,
  title,
  titleAccent,
  intro,
  children,
}: {
  slug: string;
  title: string;
  titleAccent: string;
  intro: string;
  children: React.ReactNode;
}) {
  const tool = findTool(slug);
  const others = liveTools().filter((t) => t.slug !== slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Free tools", item: `${SITE_URL}/free-tools` },
          {
            "@type": "ListItem",
            position: 3,
            name: tool?.name ?? `${title} ${titleAccent}`,
            item: `${SITE_URL}/free-tools/${slug}`,
          },
        ],
      },
      {
        "@type": "WebApplication",
        name: tool?.name ?? `${title} ${titleAccent}`,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Any",
        url: `${SITE_URL}/free-tools/${slug}`,
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
            {title}{" "}
            <span className="font-serif-accent font-medium italic text-[#F26419]">
              {titleAccent}
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-stone-400 sm:text-base">
            {intro}
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-[1280px] px-6">
        <div className="-mt-6">{children}</div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-stone-200 pt-6">
          <Link
            href="/free-tools"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 transition-colors hover:text-orange-700"
          >
            <ArrowLeft size={14} aria-hidden /> All free tools
          </Link>
          <div className="flex flex-wrap gap-3">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/free-tools/${o.slug}`}
                className="group flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:border-[#F26419] hover:text-orange-700"
              >
                {createElement(navIcon(o.icon), { size: 13, "aria-hidden": true })}
                {o.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-12 rounded-[2rem] bg-stone-900 px-6 py-10 text-center sm:px-12">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Want us to do the heavy lifting?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-stone-400">
            A free 30-minute expert call, plus the 15-page audit — whether or not you hire us.
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
