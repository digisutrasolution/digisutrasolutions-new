import { db } from "@/lib/db";

/**
 * Aggregations for the admin dashboard.
 *
 * Every figure is compared against the immediately preceding window of the
 * same length, because a number without a baseline tells an owner nothing.
 * Where the comparison is not meaningful — a previous window of zero — the
 * delta is returned as null and the UI prints a dash rather than an
 * invented percentage.
 */

export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

export function parseRange(value?: string): RangeDays {
  const n = Number(value);
  return (RANGES as readonly number[]).includes(n) ? (n as RangeDays) : 30;
}

function startOfDayUTCOffset(daysBack: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysBack);
  return d;
}

export type Delta = { pct: number | null; direction: "up" | "down" | "flat" };

function delta(current: number, previous: number): Delta {
  if (previous === 0) {
    // No baseline: growth from zero is not a percentage anyone can act on.
    return { pct: null, direction: current > 0 ? "up" : "flat" };
  }
  const pct = ((current - previous) / previous) * 100;
  return {
    pct: Math.round(pct),
    direction: pct > 0.5 ? "up" : pct < -0.5 ? "down" : "flat",
  };
}

export type DayPoint = { date: string; value: number };

/* Daily buckets come from SQL: one round trip instead of N counts, and
   date_trunc keeps the grouping in the database's timezone consistently. */
async function dailySeries(
  table: "Lead" | "PageView",
  since: Date,
  days: number,
): Promise<DayPoint[]> {
  const rows = await db.$queryRawUnsafe<{ day: Date; n: bigint }[]>(
    `SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS n
     FROM "${table}" WHERE "createdAt" >= $1
     GROUP BY 1 ORDER BY 1`,
    since,
  ).catch(() => []);

  const counts = new Map(
    rows.map((r) => [new Date(r.day).toISOString().slice(0, 10), Number(r.n)]),
  );
  // Zero-fill: a gap in the data is a real zero, not a missing bar.
  return Array.from({ length: days }, (_, i) => {
    const d = startOfDayUTCOffset(days - 1 - i);
    const key = d.toISOString().slice(0, 10);
    return { date: key, value: counts.get(key) ?? 0 };
  });
}

export type BarRow = { label: string; value: number; hint?: string };

export async function getDashboard(days: RangeDays) {
  const since = startOfDayUTCOffset(days - 1);
  const prevSince = startOfDayUTCOffset(days * 2 - 1);

  const [
    leads,
    prevLeads,
    views,
    prevViews,
    subs,
    prevSubs,
    leadsByDay,
    viewsByDay,
    bySource,
    byStatus,
    recentLeads,
    topPages,
    topReferrers,
    heard,
    ads,
    inTesting,
    awaitingApproval,
    openBugs,
    activeSessions,
  ] = await Promise.all([
    db.lead.count({ where: { createdAt: { gte: since } } }),
    db.lead.count({ where: { createdAt: { gte: prevSince, lt: since } } }),
    db.pageView.count({ where: { createdAt: { gte: since } } }),
    db.pageView.count({ where: { createdAt: { gte: prevSince, lt: since } } }),
    db.newsletterSubscriber.count({ where: { createdAt: { gte: since } } }),
    db.newsletterSubscriber.count({
      where: { createdAt: { gte: prevSince, lt: since } },
    }),
    dailySeries("Lead", since, days),
    dailySeries("PageView", since, days),
    db.lead.groupBy({
      by: ["source"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    db.lead.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    db.lead.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        source: true,
        services: true,
        createdAt: true,
        status: true,
      },
    }),
    db.pageView.groupBy({
      by: ["path"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { path: "desc" } },
      take: 8,
    }),
    db.pageView.groupBy({
      by: ["referrer"],
      where: { createdAt: { gte: since }, referrer: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { referrer: "desc" } },
      take: 6,
    }),
    db.lead.findMany({
      where: { createdAt: { gte: since }, heardFrom: { not: null } },
      select: { heardFrom: true },
    }),
    db.adBanner.aggregate({ _sum: { impressions: true, clicks: true } }),
    db.page.count({ where: { workflowStage: "TESTING" } }),
    db.page.count({ where: { workflowStage: "APPROVAL" } }),
    db.bugReport.count({ where: { status: "OPEN" } }),
    db.refreshToken.count({
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
    }),
  ]);

  /* Services live in a string[] column, so the tally happens here rather
     than in SQL — the row count is small enough that it does not matter. */
  const serviceTally = new Map<string, number>();
  const leadRows = await db.lead.findMany({
    where: { createdAt: { gte: since } },
    select: { services: true },
  });
  for (const row of leadRows) {
    for (const s of row.services) {
      serviceTally.set(s, (serviceTally.get(s) ?? 0) + 1);
    }
  }

  const heardTally = new Map<string, number>();
  for (const h of heard) {
    if (!h.heardFrom) continue;
    heardTally.set(h.heardFrom, (heardTally.get(h.heardFrom) ?? 0) + 1);
  }

  const toBars = (m: Map<string, number>, take = 6): BarRow[] =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, take)
      .map(([label, value]) => ({ label, value }));

  /* Enquiry rate, not "conversion rate": we count pageviews, not sessions,
     so calling it conversion would overstate what the number knows. */
  const rate = views > 0 ? (leads / views) * 100 : 0;
  const prevRate = prevViews > 0 ? (prevLeads / prevViews) * 100 : 0;

  const impressions = ads._sum.impressions ?? 0;
  const clicks = ads._sum.clicks ?? 0;

  return {
    days,
    kpis: {
      leads: { value: leads, delta: delta(leads, prevLeads), series: leadsByDay },
      views: { value: views, delta: delta(views, prevViews), series: viewsByDay },
      rate: {
        value: rate,
        delta: delta(Math.round(rate * 100), Math.round(prevRate * 100)),
      },
      subscribers: { value: subs, delta: delta(subs, prevSubs) },
    },
    leadsByDay,
    viewsByDay,
    sources: bySource
      .map((s) => ({ label: s.source, value: s._count._all }))
      .sort((a, b) => b.value - a.value),
    statuses: byStatus
      .map((s) => ({ label: s.status, value: s._count._all }))
      .sort((a, b) => b.value - a.value),
    services: toBars(serviceTally),
    heardFrom: toBars(heardTally),
    recentLeads,
    topPages: topPages.map((p) => ({ label: p.path, value: p._count._all })),
    topReferrers: topReferrers.map((r) => ({
      label: r.referrer ?? "direct",
      value: r._count._all,
    })),
    ads: {
      impressions,
      clicks,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    },
    ops: { inTesting, awaitingApproval, openBugs, activeSessions },
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;
