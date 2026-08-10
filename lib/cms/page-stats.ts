import "server-only";
import { db } from "@/lib/db";

/* Per-page performance for the pages list.

   Two aggregates rather than a query per row, so this stays flat whether the
   CMS holds twenty pages or a thousand:
     - views come from PageView.path, which is indexed on [path, createdAt]
     - leads come from Lead.landingPageId, the FK Phase 3 added

   Leads are counted by the page a visitor LANDED on, not the page they
   happened to submit from. That is the whole point of first-touch capture: an
   ad landing page gets credit for an enquiry finished on /contact. */

export const STATS_WINDOW_DAYS = 30;

export type PageStats = {
  views: number;
  leads: number;
  /** leads ÷ views, or null when there is nothing to divide by. */
  conversion: number | null;
};

const EMPTY: PageStats = { views: 0, leads: 0, conversion: null };

export async function getPageStats(
  pages: { id: string; slug: string }[],
  days = STATS_WINDOW_DAYS,
): Promise<Map<string, PageStats>> {
  const out = new Map<string, PageStats>();
  if (pages.length === 0) return out;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const paths = pages.map((p) => `/${p.slug}`);
  const ids = pages.map((p) => p.id);

  const [views, leads] = await Promise.all([
    db.pageView
      .groupBy({
        by: ["path"],
        where: { path: { in: paths }, createdAt: { gte: since } },
        _count: { _all: true },
      })
      .catch(() => []),
    db.lead
      .groupBy({
        by: ["landingPageId"],
        where: {
          landingPageId: { in: ids },
          createdAt: { gte: since },
          deletedAt: null,
          // Quarantined junk would inflate the rate and flatter a bad page.
          status: { not: "SPAM" },
        },
        _count: { _all: true },
      })
      .catch(() => []),
  ]);

  const viewsByPath = new Map(views.map((v) => [v.path, v._count._all]));
  const leadsById = new Map(
    leads.map((l) => [l.landingPageId ?? "", l._count._all]),
  );

  for (const page of pages) {
    const v = viewsByPath.get(`/${page.slug}`) ?? 0;
    const l = leadsById.get(page.id) ?? 0;
    out.set(page.id, {
      views: v,
      leads: l,
      // No views means no denominator — showing 0% would read as "this page
      // converts badly" when the truth is "nobody has seen it".
      conversion: v > 0 ? l / v : null,
    });
  }
  return out;
}

export { EMPTY as EMPTY_PAGE_STATS };
