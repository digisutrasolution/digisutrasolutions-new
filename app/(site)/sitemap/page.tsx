import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_CATEGORIES } from "@/lib/blog";
import { db } from "@/lib/db";
import { liveTools } from "@/lib/free-tools";
import { getLiveNav } from "@/lib/menu";
import { getLiveServices } from "@/lib/services";
import { absUrl } from "@/lib/site";

/* Human-readable sitemap. A coded route (it wins over the [...slug] CMS
   catch-all) so it is built from the same live sources as /sitemap.xml — the
   nav tree, every visible service, blog categories + latest posts, the live
   free tools and the legal pages — and can never fall out of sync the way a
   hand-maintained list of links would. */

export const metadata: Metadata = {
  title: "Sitemap",
  description:
    "Every page on DigiSutra Solutions in one place — services, work, resources, blog and company pages.",
  alternates: { canonical: absUrl("/sitemap") },
};

export const revalidate = 3600;

type LinkItem = { label: string; href: string; badge?: string };

function ColumnHeading({ title, href }: { title: string; href?: string }) {
  const cls =
    "font-display text-sm font-black uppercase tracking-[0.18em] text-[#F26419]";
  return href ? (
    <Link href={href} className={`${cls} no-underline hover:underline`}>
      {title}
    </Link>
  ) : (
    <p className={cls}>{title}</p>
  );
}

function SiteLink({ item }: { item: LinkItem }) {
  return (
    <Link
      href={item.href}
      className="inline-flex items-center gap-2 text-sm text-stone-600 no-underline transition-colors hover:text-stone-900"
    >
      <span className="h-1 w-1 shrink-0 rounded-full bg-stone-300" aria-hidden />
      <span>{item.label}</span>
      {item.badge && (
        <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-900">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

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
  return (
    <div>
      <ColumnHeading title={title} href={href} />
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <SiteLink item={l} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function SitemapPage() {
  const [nav, legal, services, posts] = await Promise.all([
    getLiveNav("HEADER"),
    getLiveNav("FOOTER_LEGAL"),
    getLiveServices(),
    db.blogPost
      .findMany({
        where: { status: "PUBLISHED", noIndex: false },
        orderBy: { publishedAt: "desc" },
        take: 10,
        select: { slug: true, title: true },
      })
      .catch(() => [] as { slug: string; title: string }[]),
  ]);
  const tools = liveTools();

  // Group services by category label, preserving their curated order.
  const svcGroups: { group: string; items: typeof services }[] = [];
  for (const s of services) {
    const g = s.group || "Services";
    let bucket = svcGroups.find((x) => x.group === g);
    if (!bucket) {
      bucket = { group: g, items: [] };
      svcGroups.push(bucket);
    }
    bucket.items.push(s);
  }

  // Nav-derived columns; Services is rendered in full separately, and
  // childless top-level items fold into a Company column.
  const navColumns = nav.filter((n) => n.children?.length && n.label !== "Services");
  const standalone = nav.filter((n) => !n.children?.length);

  const company: LinkItem[] = [
    { label: "Home", href: "/" },
    ...standalone.map((n) => ({ label: n.label, href: n.href })),
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Payment options", href: "/payment" },
    { label: "Free 15-page audit", href: "/free-audit" },
  ];

  const legalLinks: LinkItem[] = legal.map((n) => ({ label: n.label, href: n.href }));

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-20 sm:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-800">
        Sitemap
      </p>
      <h1 className="font-display mt-4 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight text-stone-900 sm:text-5xl">
        Everything,{" "}
        <span className="font-serif-accent italic text-orange-600">one page</span>
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-600 sm:text-base">
        Every page on the site, grouped by section. Prefer the machine-readable
        version search engines use?{" "}
        <a
          href="/sitemap.xml"
          className="font-semibold text-[#F26419] no-underline hover:underline"
        >
          /sitemap.xml
        </a>
        .
      </p>

      {/* Services — full list, grouped by category */}
      <section className="mt-14">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-stone-900">
            Services
          </h2>
          <Link
            href="/services"
            className="shrink-0 text-sm font-semibold text-[#F26419] no-underline hover:underline"
          >
            All services →
          </Link>
        </div>
        <div className="mt-6 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {svcGroups.map((g) => (
            <LinkColumn
              key={g.group}
              title={g.group}
              links={g.items.map((s) => ({
                label: s.name,
                href: `/services/${s.slug}`,
                badge: s.badge,
              }))}
            />
          ))}
        </div>
      </section>

      {/* About / Work / Resources / Newsroom (from the nav) + Company, Blog, Legal */}
      <section className="mt-14 border-t border-stone-200 pt-12">
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
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

          <div>
            <ColumnHeading title="Blog" href="/blog" />
            <ul className="mt-3 space-y-2">
              {BLOG_CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <SiteLink item={{ label: c.label, href: `/blog/category/${c.slug}` }} />
                </li>
              ))}
            </ul>
            {posts.length > 0 && (
              <>
                <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">
                  Latest articles
                </p>
                <ul className="mt-2 space-y-2">
                  {posts.map((p) => (
                    <li key={p.slug}>
                      <SiteLink item={{ label: p.title, href: `/blog/${p.slug}` }} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <LinkColumn title="Legal" links={legalLinks} />
        </div>
      </section>

      {/* Free tools — the full live set */}
      {tools.length > 0 && (
        <section className="mt-14 border-t border-stone-200 pt-12">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-stone-900">
              Free tools
            </h2>
            <Link
              href="/free-tools"
              className="shrink-0 text-sm font-semibold text-[#F26419] no-underline hover:underline"
            >
              All {tools.length} tools →
            </Link>
          </div>
          <div className="mt-6 gap-x-8 sm:columns-2 lg:columns-3 xl:columns-4">
            {tools.map((t) => (
              <Link
                key={t.slug}
                href={`/free-tools/${t.slug}`}
                className="mb-2 flex break-inside-avoid items-center gap-2 text-sm text-stone-600 no-underline transition-colors hover:text-stone-900"
              >
                <span className="h-1 w-1 shrink-0 rounded-full bg-stone-300" aria-hidden />
                <span>{t.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
