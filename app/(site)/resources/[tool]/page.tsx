import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createElement } from "react";
import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";
import { navIcon } from "@/components/nav-icons";
import { TOOLS, findTool, liveTools } from "@/lib/resources";
import { SITE_URL } from "@/lib/site";

/* Placeholder route for catalogued tools that don't have their own page
   yet — the Resources menu links to all of them, so this keeps every link
   honest instead of 404ing. Tools with a real route (e.g. roi-calculator)
   have their own folder and win over this dynamic segment. Noindexed so
   Google never sees thin pages. */

export function generateStaticParams() {
  return TOOLS.filter((t) => t.status === "soon").map((t) => ({ tool: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const { tool } = await params;
  const t = findTool(tool);
  if (!t) return {};
  return {
    title: `${t.name} — coming soon`,
    description: t.blurb,
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE_URL}/resources/${t.slug}` },
  };
}

export default async function ToolComingSoonPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool } = await params;
  const t = findTool(tool);
  if (!t) notFound();

  const others = liveTools().filter((x) => x.slug !== t.slug);

  return (
    <section className="mx-auto max-w-[1280px] px-6 pb-16 pt-12 sm:pb-24 sm:pt-16">
      <Link
        href="/resources"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 transition-colors hover:text-orange-700"
      >
        <ArrowLeft size={14} aria-hidden /> All free tools
      </Link>

      <div className="mx-auto mt-8 max-w-2xl rounded-[2rem] border border-stone-200 bg-white p-8 text-center sm:p-12">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
          {createElement(navIcon(t.icon), { size: 22, "aria-hidden": true })}
        </span>
        <h1 className="font-display mt-4 text-3xl font-extrabold tracking-tight text-stone-900">
          {t.name}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600 sm:text-base">{t.blurb}</p>
        <p className="mt-5 inline-block rounded-full bg-stone-100 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-stone-500">
          In the works
        </p>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-stone-600">
          We&rsquo;re building this one now. In the meantime, our team will do it for you — ask on
          WhatsApp and you&rsquo;ll get an answer the same day.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <a
            href={`https://wa.me/919953900123?text=${encodeURIComponent(
              `Hi DigiSutra! I was looking for the ${t.name} tool on your site.`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#F26419] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
          >
            <MessageCircle size={15} aria-hidden /> Ask us instead
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-6 py-2.5 text-sm font-bold text-stone-800 transition-colors hover:border-[#F26419] hover:text-orange-700"
          >
            Claim your free expert call <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </div>

      {others.length > 0 && (
        <div className="mt-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-800">
            Ready to use today
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/resources/${o.slug}`}
                className="group flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:border-[#F26419] hover:text-orange-700"
              >
                {createElement(navIcon(o.icon), { size: 13, "aria-hidden": true })}
                {o.name}
                <ArrowRight
                  size={12}
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                />
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
