import Link from "next/link";
import { redirect } from "next/navigation";
import { userCan, canSeeAllLeads, leadScopeWhere } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getScoringConfig } from "@/lib/scoring-server";
import { StatTile, BarList } from "@/components/admin/dashboard-charts";
import HomeFollowUps from "@/components/admin/HomeFollowUps";
import { formatMoney } from "@/lib/quotations";
import {
  PIPELINE_STATUSES, STATUS_LABEL, STATUS_STYLE, PRIORITY_STYLE, sourceLabel,
} from "@/lib/crm";
import { BAND_STYLE, bandOf } from "@/lib/scoring";

export const metadata = { title: "Sales overview" };

export default async function CrmHomePage() {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "leads.manage")) redirect("/admin");

  const cfg = await getScoringConfig();
  const scope = leadScopeWhere(user);
  const base = { deletedAt: null, ...scope } as const;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);

  const [
    newLeads7d, hotCount, pipelineAgg, wonCount, byStatus,
    hotLeads, myFollowups, recentActivity,
  ] = await Promise.all([
    db.lead.count({ where: { ...base, createdAt: { gte: weekAgo } } }),
    db.lead.count({ where: { ...base, score: { gte: cfg.hotMin } } }),
    db.lead.aggregate({ where: { ...base, status: { notIn: ["WON", "LOST", "SPAM", "DUPLICATE"] } }, _sum: { expectedRevenue: true } }),
    db.lead.count({ where: { ...base, status: "WON" } }),
    db.lead.groupBy({ by: ["status"], where: base, _count: { status: true } }),
    db.lead.findMany({ where: { ...base, score: { gte: cfg.hotMin } }, orderBy: { score: "desc" }, take: 6, select: { id: true, name: true, company: true, score: true, status: true, source: true, priority: true } }),
    db.followUp.findMany({ where: { ownerId: user.id, status: "PENDING", dueAt: { lte: endOfToday }, lead: { deletedAt: null } }, orderBy: { dueAt: "asc" }, take: 8, include: { lead: { select: { id: true, name: true } } } }),
    db.leadActivity.findMany({ where: { lead: { deletedAt: null, ...scope } }, orderBy: { createdAt: "desc" }, take: 8, include: { lead: { select: { id: true, name: true } } } }),
  ]);

  const statusCount = new Map(byStatus.map((r) => [r.status, r._count.status]));
  const pipelineRows = PIPELINE_STATUSES.map((s) => ({ label: STATUS_LABEL[s], value: statusCount.get(s) ?? 0 }));
  const followupItems = myFollowups.map((f) => ({ id: f.id, title: f.title, type: f.type, dueAt: f.dueAt.toISOString(), leadId: f.leadId, leadName: f.lead.name }));

  const card = "rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900";
  const cardHead = "flex items-center justify-between";
  const cardLink = "text-xs font-semibold text-orange-600 hover:underline";

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Hello, {user.name.split(" ")[0]}
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        Your sales overview{canSeeAllLeads(user) ? "" : " — your assigned leads"}.
      </p>

      {/* KPIs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="New leads (7 days)" value={newLeads7d.toLocaleString("en-IN")} hint="freshly captured" />
        <StatTile label="Hot leads" value={hotCount.toLocaleString("en-IN")} hint={`score ≥ ${cfg.hotMin}`} />
        <StatTile label="Open pipeline" value={formatMoney(pipelineAgg._sum.expectedRevenue ?? 0)} hint="expected revenue, open" />
        <StatTile label="Won" value={wonCount.toLocaleString("en-IN")} hint="closed-won leads" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* My follow-ups today */}
        <div className={card}>
          <div className={cardHead}>
            <h2 className="font-display text-sm font-bold">My follow-ups today</h2>
            <Link href="/admin/followups" className={cardLink}>All follow-ups</Link>
          </div>
          <div className="mt-3">
            <HomeFollowUps initial={followupItems} />
          </div>
        </div>

        {/* Pipeline */}
        <BarList title="Pipeline by stage" rows={pipelineRows} empty="No leads yet." />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Hot leads */}
        <div className={card}>
          <div className={cardHead}>
            <h2 className="font-display text-sm font-bold">Hot leads</h2>
            <Link href="/admin/leads?band=HOT" className={cardLink}>View all</Link>
          </div>
          <ul className="mt-3 space-y-2">
            {hotLeads.length === 0 && <li className="text-xs text-stone-400">No hot leads right now.</li>}
            {hotLeads.map((l) => (
              <li key={l.id}>
                <Link href={`/admin/leads/${l.id}`} className="flex items-center gap-3 rounded-xl border border-stone-200 p-2.5 transition-colors hover:bg-orange-50/40 dark:border-stone-800 dark:hover:bg-stone-800/40">
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${l.score != null ? BAND_STYLE[bandOf(l.score, cfg)] : ""}`}>{l.score ?? "—"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-stone-800 dark:text-stone-100">{l.name}</span>
                    <span className="block truncate text-[11px] text-stone-500">{l.company ? `${l.company} · ` : ""}{sourceLabel(l.source)}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[l.status as keyof typeof STATUS_STYLE] ?? ""}`}>{STATUS_LABEL[l.status as keyof typeof STATUS_LABEL] ?? l.status}</span>
                  <span className={`hidden shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold sm:inline ${PRIORITY_STYLE[l.priority as keyof typeof PRIORITY_STYLE] ?? ""}`}>{l.priority.charAt(0)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent activity */}
        <div className={card}>
          <h2 className="font-display text-sm font-bold">Recent activity</h2>
          <ol className="mt-3 space-y-3 border-l border-stone-200 pl-4 dark:border-stone-800">
            {recentActivity.length === 0 && <li className="text-xs text-stone-400">No activity yet.</li>}
            {recentActivity.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-orange-500" aria-hidden />
                <p className="text-sm text-stone-700 dark:text-stone-200">{a.message}</p>
                <p className="text-[11px] text-stone-400">
                  <Link href={`/admin/leads/${a.leadId}`} className="hover:text-orange-600">{a.lead.name}</Link>
                  {" · "}{new Date(a.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
