import type { Metadata } from "next";
import { createElement } from "react";
import Link from "next/link";
import { BLOG_CATEGORIES } from "@/lib/blog";
import { db } from "@/lib/db";
import { liveTools } from "@/lib/free-tools";
import { getLiveNav } from "@/lib/menu";
import { getLiveServices } from "@/lib/services";
import { navIcon } from "@/components/nav-icons";
import { absUrl } from "@/lib/site";

/* Human-readable sitemap. A coded route (it wins over the [...slug] CMS
   catch-all) so it is built from the same live sources as /sitemap.xml — the
   nav tree, every visible service, blog categories + latest posts, the live
   free tools and the legal pages — and can never fall out of sync the way a
   hand-maintained list of links would.

   Presented as numbered bands rather than one wall of identical columns:
   services carry a blurb and a badge so they read as cards, tools use the
   groups they already declare, and the boilerplate legal links shrink to
   chips. Deliberately zero client JS — the main audience is a crawler. */

export const metadata: Metadata = {
  title: "Sitemap",
  description:
    "Every page on DigiSutra Solutions in one place — services, free tools, articles and company pages.",
  alternates: { canonical: absUrl("/sitemap") },
};

export const revalidate = 3600;

type LinkItem = { label: string; href: string; badge?: string };

function BandHeading({
  num,
  title,
  allHref,
  allLabel,
}: {
  num: string;
  title: string;
  allHref?: string;
  allLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
      <div className="flex items-center gap-2.5">
        <span className="font-display rounded-md bg-orange-100 px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums text-orange-800">
          {num}
        </span>
        <h2 className="font-display text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">
          {title}
        </h2>
      </div>
      {allHref && (
        <Link
          href={allHref}
          className="shrink-0 text-sm font-semibold text-[#F26419] no-underline hover:underline"
        >
          {allLabel} →
        </Link>
      )}
    </div>
  );
}

function SiteLink({ item }: { item: LinkItem }) {
  return (
    <Link
      href={item.href}
      className="flex items-center gap-2 py-1 text-sm text-stone-600 no-underline transition-colors hover:text-[#F26419]"
    >
      <span className="h-1 w-1 shrink-0 rounded-full bg-orange-400/60" aria-hidden />
      <span>{item.label}</span>
      {item.badge && (
        <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-orange-900">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

/** A titled run of links — used for tool groups and the smaller sections. */
function LinkColumn({
  title,
  href,
  links,
}: {
  title: string;
  href?: string;
  links: LinkItem[];
}) {
  if (!links.length) return null;
  const heading =
    "text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-800";
  return (
    <div className="min-w-0">
      {href ? (
        <Link href={href} className={`${heading} no-underline hover:underline`}>
          {title}
        </Link>
      ) : (
        <p className={heading}>{title}</p>
      )}
      <div className="mt-2.5">
        {links.map((l) => (
          <SiteLink key={`${l.href}-${l.label}`} item={l} />
        ))}
      </div>
    </div>
  );
}

const dateFmt = (d: Date | null) =>
  d
    ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "";

export default async function SitemapPage() {
  const [nav, legal, services, posts] = await Promise.all([
    getLiveNav("HEADER"),
    getLiveNav("FOOTER_LEGAL"),
    getLiveServices(),
    db.blogPost
      .findMany({
        where: { status: "PUBLISHED", noIndex: false },
        orderBy: { publishedAt: "desc" },
        take: 6,
        select: { slug: true, title: true, category: true, publishedAt: true },
      })
      .catch(() => [] as { slug: string; title: string; category: string; publishedAt: Date | null }[]),
  ]);
  const tools = liveTools();

  // Tools already declare their own group, so reuse it rather than inventing one.
  const toolGroups: { group: string; items: typeof tools }[] = [];
  for (const t of tools) {
    const g = t.group || "Tools";
    let bucket = toolGroups.find((x) => x.group === g);
    if (!bucket) {
      bucket = { group: g, items: [] };
      toolGroups.push(bucket);
    }
    bucket.items.push(t);
  }

  /* Nav-derived columns, minus anything this page already renders in full
     further down — otherwise Services and the free tools appear twice, the
     second time with whatever count the menu label happens to say (the tools
     column read "19" against a real 18). Matched on href, not label, because
     the labels get renamed in admin: "Resources" became "Free Tools" and a
     label check would have silently stopped excluding it. Childless top-level
     items fold into the Company column instead. */
  const RENDERED_IN_FULL = new Set(["/services", "/free-tools"]);
  const navColumns = nav.filter(
    (n) => n.children?.length && !RENDERED_IN_FULL.has(n.href),
  );
  const standalone = nav.filter((n) => !n.children?.length);

  const company: LinkItem[] = [
    { label: "Home", href: "/" },
    ...standalone.map((n) => ({ label: n.label, href: n.href })),
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Payment options", href: "/payment" },
    { label: "Free 15-page audit", href: "/free-audit" },
  ];

  // Headline count of everything linked from this page.
  const pageCount =
    services.length +
    tools.length +
    navColumns.reduce((n, c) => n + (c.children?.length ?? 0), 0) +
    company.length +
    BLOG_CATEGORIES.length +
    legal.length;

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-20 sm:py-24">
      {/* Masthead + live counts */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
            Sitemap
          </p>
          <h1 className="font-display mt-4 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight text-stone-900 sm:text-5xl">
            Everything,{" "}
            <span className="font-serif-accent italic text-orange-600">one page</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-600 sm:text-base">
            Every page on the site, grouped by section and generated from what is
            actually published — never a hand-kept list.
          </p>
        </div>
        <div className="grid max-w-md grid-cols-3 gap-2.5 lg:w-[320px]">
          {[
            { n: services.length, l: "Services" },
            { n: tools.length, l: "Free tools" },
            { n: pageCount, l: "Pages" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-2xl border border-stone-200 bg-white p-3.5"
            >
              <p className="font-display text-2xl font-extrabold tabular-nums text-[#F26419]">
                {s.n}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-stone-500">
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 01 — Services as cards. These are the money pages; as bullets they
          looked identical to a cookie-policy link. */}
      {services.length > 0 && (
        <section className="mt-16 border-t border-stone-200 pt-10">
          <BandHeading num="01" title="Services" allHref="/services" allLabel="All services" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className="group rounded-2xl border border-stone-200 bg-white p-4 no-underline transition-all duration-300 hover:-translate-y-0.5 hover:border-[#F26419] hover:shadow-[0_14px_34px_rgba(28,25,23,0.07)]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-700 transition-colors duration-300 group-hover:bg-[#F26419] group-hover:text-white">
                    {createElement(navIcon(s.icon), { size: 15, "aria-hidden": true })}
                  </span>
                  <span className="font-display min-w-0 text-[15px] font-bold tracking-tight text-stone-900">
                    {s.name}
                  </span>
                  {s.badge && (
                    <span className="ml-auto shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-bold uppercase text-orange-900">
                      {s.badge}
                    </span>
                  )}
                </div>
                {s.blurb && (
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-stone-600">
                    {s.blurb}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 02 — Free tools, in the groups they already declare. */}
      {tools.length > 0 && (
        <section className="mt-14 border-t border-stone-200 pt-10">
          <BandHeading
            num="02"
            title="Free tools"
            allHref="/free-tools"
            allLabel={`All ${tools.length} tools`}
          />
          <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            {toolGroups.map((g) => (
              <LinkColumn
                key={g.group}
                title={g.group}
                links={g.items.map((t) => ({
                  label: t.name,
                  href: `/free-tools/${t.slug}`,
                }))}
              />
            ))}
          </div>
        </section>
      )}

      {/* 03 — Latest articles. Worth cards now that posts go up daily. */}
      {posts.length > 0 && (
        <section className="mt-14 border-t border-stone-200 pt-10">
          <BandHeading num="03" title="Latest articles" allHref="/blog" allLabel="Visit the blog" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="rounded-2xl border border-stone-200 bg-white p-4 no-underline transition-all duration-300 hover:-translate-y-0.5 hover:border-[#F26419] hover:shadow-[0_14px_34px_rgba(28,25,23,0.07)]"
              >
                <p className="text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-orange-800">
                  {p.category}
                </p>
                <p className="mt-1.5 text-[13.5px] font-semibold leading-snug text-stone-900">
                  {p.title}
                </p>
                {p.publishedAt && (
                  <p className="mt-2 text-[11px] text-stone-500">{dateFmt(p.publishedAt)}</p>
                )}
              </Link>
            ))}
          </div>
          <div className="mt-5">
            <LinkColumn
              title="Browse by category"
              links={BLOG_CATEGORIES.map((c) => ({
                label: c.label,
                href: `/blog/category/${c.slug}`,
              }))}
            />
          </div>
        </section>
      )}

      {/* 04 — Everything else: nav sections + company, with legal as chips. */}
      <section className="mt-14 border-t border-stone-200 pt-10">
        <BandHeading num="04" title="Company &amp; more" />
        <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
          {navColumns.map((n) => (
            <LinkColumn
              key={n.label}
              title={n.label}
              href={n.href}
              links={(n.children ?? []).map((c) => ({
                label: c.label,
                href: c.href,
                badge: c.badge,
              }))}
            />
          ))}
          <LinkColumn title="Company" links={company} />
        </div>

        {legal.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2 border-t border-dashed border-stone-200 pt-6">
            {legal.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs text-stone-600 no-underline transition-colors hover:border-[#F26419] hover:text-[#F26419]"
              >
                {n.label}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Machine-readable pointer */}
      <div className="mt-12 flex flex-wrap items-center gap-4 rounded-2xl bg-stone-900 px-5 py-4">
        <p className="text-sm text-stone-300">
          <span className="font-bold text-white">Machine-readable version</span> — regenerated
          the moment you publish.
        </p>
        <a
          href="/sitemap.xml"
          className="ml-auto shrink-0 rounded-full bg-[#F26419] px-5 py-2 text-xs font-bold text-white no-underline transition-transform hover:-translate-y-0.5"
        >
          /sitemap.xml →
        </a>
      </div>
    </div>
  );
}
