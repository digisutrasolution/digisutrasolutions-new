import "server-only";
import { db } from "@/lib/db";
import { getScoringConfig } from "@/lib/scoring-server";
import { SOURCE_LABEL, STATUS_LABEL } from "@/lib/crm";
import type { BarRow, DayPoint } from "@/lib/dashboard";

export const REPORT_RANGES = [7, 30, 90] as const;
export type ReportRange = (typeof REPORT_RANGES)[number];

/** Aggregated CRM report data for the given window (days). Managers-only. */
export async function getLeadReports(days: number) {
  const now = new Date();
  const since = new Date(now.getTime() - days * 86_400_000);
  const base = { deletedAt: null } as const;

  const [
    total, newInRange, won, lost,
    byStatus, bySource, byOwner,
    scoreAgg, pipelineAgg, createdRows, cfg,
    quoteCount, quoteSum, quoteAccepted,
  ] = await Promise.all([
    db.lead.count({ where: base }),
    db.lead.count({ where: { ...base, createdAt: { gte: since } } }),
    db.lead.count({ where: { ...base, status: "WON" } }),
    db.lead.count({ where: { ...base, status: "LOST" } }),
    db.lead.groupBy({ by: ["status"], where: base, _count: { status: true } }),
    db.lead.groupBy({ by: ["source"], where: base, _count: { source: true } }),
    db.lead.groupBy({ by: ["assignedToId"], where: base, _count: { assignedToId: true } }),
    db.lead.aggregate({ where: { ...base, score: { not: null } }, _avg: { score: true } }),
    db.lead.aggregate({
      where: { ...base, status: { notIn: ["WON", "LOST", "SPAM", "DUPLICATE"] } },
      _sum: { expectedRevenue: true },
    }),
    db.lead.findMany({ where: { ...base, createdAt: { gte: since } }, select: { createdAt: true } }),
    getScoringConfig(),
    db.quotation.count(),
    db.quotation.aggregate({ _sum: { total: true } }),
    db.quotation.aggregate({ where: { status: "ACCEPTED" }, _sum: { total: true } }),
  ]);

  // Score bands from the live thresholds.
  const [hot, warm, cold] = await Promise.all([
    db.lead.count({ where: { ...base, score: { gte: cfg.hotMin } } }),
    db.lead.count({ where: { ...base, score: { gte: cfg.warmMin, lt: cfg.hotMin } } }),
    db.lead.count({ where: { ...base, score: { lt: cfg.warmMin } } }),
  ]);

  // Owner names for the by-owner bars.
  const ownerIds = byOwner.map((o) => o.assignedToId).filter((x): x is string => !!x);
  const owners = ownerIds.length
    ? await db.user.findMany({ where: { id: { in: ownerIds } }, select: { id: true, name: true } })
    : [];
  const ownerName = new Map(owners.map((u) => [u.id, u.name]));

  const statusBars: BarRow[] = byStatus
    .map((r) => ({ label: STATUS_LABEL[r.status] ?? r.status, value: r._count.status }))
    .sort((a, b) => b.value - a.value);
  const sourceBars: BarRow[] = bySource
    .map((r) => ({ label: SOURCE_LABEL[r.source] ?? r.source, value: r._count.source }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  const ownerBars: BarRow[] = byOwner
    .map((r) => ({ label: r.assignedToId ? (ownerName.get(r.assignedToId) ?? "—") : "Unassigned", value: r._count.assignedToId }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  const bandBars: BarRow[] = [
    { label: "Hot", value: hot },
    { label: "Warm", value: warm },
    { label: "Cold", value: cold },
  ];

  // Leads-per-day series over the window (zero-filled).
  const perDay = zeroFilledDays(createdRows.map((r) => r.createdAt), since, now);

  const conversion = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0;

  return {
    days,
    kpis: {
      total,
      newInRange,
      won,
      lost,
      conversion,
      avgScore: Math.round(scoreAgg._avg.score ?? 0),
      pipelineValue: pipelineAgg._sum.expectedRevenue ?? 0,
    },
    quotes: {
      count: quoteCount,
      totalValue: quoteSum._sum.total ?? 0,
      acceptedValue: quoteAccepted._sum.total ?? 0,
    },
    perDay,
    statusBars,
    sourceBars,
    ownerBars,
    bandBars,
  };
}

function zeroFilledDays(dates: Date[], since: Date, now: Date): DayPoint[] {
  const key = (d: Date) => d.toISOString().slice(0, 10);
  const counts = new Map<string, number>();
  for (const d of dates) counts.set(key(d), (counts.get(key(d)) ?? 0) + 1);
  const out: DayPoint[] = [];
  const cur = new Date(since);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  while (cur <= end) {
    const k = key(cur);
    out.push({ date: k, value: counts.get(k) ?? 0 });
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}
