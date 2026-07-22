import Link from "next/link";
import { createElement } from "react";
import { ArrowLeft } from "lucide-react";
import CtaBand from "@/components/CtaBand";
import PageHero from "@/components/PageHero";
import { navIcon } from "@/components/nav-icons";
import { findTool, liveTools } from "@/lib/free-tools";
import { SITE_URL } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";

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
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(jsonLd)}
      />
      <PageHero
        eyebrow="Free tool"
        title={title}
        titleAccent={titleAccent}
        intro={intro}
        image="/free-tools-hero.jpg"
      />

      <section className="mx-auto max-w-[1280px] px-6 py-12 sm:py-16">
        <div>{children}</div>

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

        <CtaBand
          className="mt-12 sm:mt-16"
          title="Want us to do the heavy lifting?"
          body="A free 30-minute expert call, plus the 15-page audit — whether or not you hire us."
        />
      </section>
    </div>
  );
}
