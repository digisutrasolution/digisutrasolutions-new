import Link from "next/link";
import { redirect } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { getLeadReports, REPORT_RANGES } from "@/lib/crm-reports";
import { formatMoney } from "@/lib/quotations";
import { StatTile, DailyChart, BarList } from "@/components/admin/dashboard-charts";

export const metadata = { title: "Lead reports" };

export default async function LeadReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "leads.viewAll")) redirect("/admin");

  const { range } = await searchParams;
  const days = REPORT_RANGES.includes(Number(range) as never) ? Number(range) : 30;
  const r = await getLeadReports(days);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Lead reports</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Pipeline health, sources, ownership and scoring across your leads.</p>
        </div>
        <div className="inline-flex rounded-full border border-stone-200 p-0.5 dark:border-stone-800">
          {REPORT_RANGES.map((d) => (
            <Link
              key={d}
              href={`/admin/leads/reports?range=${d}`}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                d === days ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900" : "text-stone-500 hover:text-stone-800 dark:text-stone-400"
              }`}
            >
              {d}d
            </Link>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total leads" value={r.kpis.total.toLocaleString("en-IN")} hint={`${r.kpis.newInRange} new in ${days} days`} />
        <StatTile label="Won" value={r.kpis.won.toLocaleString("en-IN")} hint={`${r.kpis.lost} lost`} />
        <StatTile label="Win rate" value={`${r.kpis.conversion}%`} hint="won ÷ (won + lost)" />
        <StatTile label="Avg. score" value={String(r.kpis.avgScore)} hint="0–100 across all leads" />
        <StatTile label="Open pipeline value" value={formatMoney(r.kpis.pipelineValue)} hint="expected revenue, open leads" />
        <StatTile label="Quotations" value={r.quotes.count.toLocaleString("en-IN")} hint={`${formatMoney(r.quotes.totalValue)} quoted`} />
        <StatTile label="Accepted quotes" value={formatMoney(r.quotes.acceptedValue)} hint="value of accepted quotations" />
        <StatTile label="New leads" value={r.kpis.newInRange.toLocaleString("en-IN")} hint={`in the last ${days} days`} />
      </div>

      {/* Trend */}
      <div className="mt-4">
        <DailyChart title="New leads per day" points={r.perDay} unit="leads" />
      </div>

      {/* Breakdowns */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <BarList title="By stage" rows={r.statusBars} empty="No leads yet." />
        <BarList title="By source" rows={r.sourceBars} empty="No leads yet." />
        <BarList title="By owner" rows={r.ownerBars} empty="No leads yet." />
        <BarList title="By score band" rows={r.bandBars} empty="No leads yet." />
      </div>
    </div>
  );
}
