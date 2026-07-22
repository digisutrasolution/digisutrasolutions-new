import Link from "next/link";
import { AlertTriangle, ArrowRight, Inbox } from "lucide-react";
import { BarList, DailyChart, StatTile } from "@/components/admin/dashboard-charts";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { RANGES, getDashboard, parseRange } from "@/lib/dashboard";

/**
 * Owner's dashboard: what the business did, then what the site needs.
 *
 * The previous version led with team members, active sessions and audit
 * events — true facts that answer nobody's question. Everything above the
 * ops strip is now demand-side: enquiries, traffic, what people asked for
 * and where they came from, each against the previous period of equal
 * length.
 */
export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: daysParam } = await searchParams;
  const days = parseRange(daysParam);

  const [user, d, recentAudit] = await Promise.all([
    getCurrentUser(),
    getDashboard(days),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const period = `last ${days} days`;
  const shortPath = (p: string) => (p.length > 34 ? `${p.slice(0, 33)}…` : p);
  const host = (r: string) => {
    try {
      return new URL(r).hostname.replace(/^www\./, "");
    } catch {
      return r;
    }
  };
  const SOURCE_LABELS: Record<string, string> = {
    CONTACT: "Contact form",
    AUDIT: "Free audit",
    ESTIMATOR: "ROI calculator",
    SUTRABOT: "DigiSutra Bot",
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            Welcome back, {user?.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Enquiries and traffic for the {period}, compared with the {days} days
            before.
          </p>
        </div>
        <div className="flex rounded-xl border border-stone-200 p-0.5 dark:border-stone-800">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin?days=${r}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                r === days
                  ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                  : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              {r}d
            </Link>
          ))}
        </div>
      </div>

      {/* Demand first */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Enquiries"
          value={String(d.kpis.leads.value)}
          delta={d.kpis.leads.delta}
          series={d.kpis.leads.series}
        />
        <StatTile
          label="Pageviews"
          value={d.kpis.views.value.toLocaleString("en-IN")}
          delta={d.kpis.views.delta}
          series={d.kpis.views.series}
        />
        <StatTile
          label="Enquiry rate"
          value={`${d.kpis.rate.value.toFixed(2)}%`}
          delta={d.kpis.rate.delta}
          hint="Enquiries ÷ pageviews — views, not unique sessions"
        />
        <StatTile
          label="Newsletter signups"
          value={String(d.kpis.subscribers.value)}
          delta={d.kpis.subscribers.delta}
        />
      </div>

      {/* Two measures, two panels — never one chart with two scales. */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <DailyChart title="Enquiries per day" points={d.leadsByDay} unit="enquiries" />
        <DailyChart title="Pageviews per day" points={d.viewsByDay} unit="views" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <BarList
          title="Where enquiries come from"
          rows={d.sources}
          empty="No enquiries in this period."
          format={(l) => SOURCE_LABELS[l] ?? l}
        />
        <BarList
          title="Services asked for"
          rows={d.services}
          empty="No services selected yet."
        />
        <BarList
          title="How they found us"
          rows={d.heardFrom}
          empty="Nobody has answered this yet."
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <BarList
          title="Most-viewed pages"
          rows={d.topPages}
          empty="No pageviews recorded."
          format={shortPath}
        />
        <BarList
          title="Top referrers"
          rows={d.topReferrers}
          empty="No referrers — traffic is direct or untracked."
          format={host}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <BarList
          title="Enquiry pipeline"
          rows={d.statuses}
          empty="Nothing in the pipeline for this period."
        />

        <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-sm font-bold text-stone-900 dark:text-stone-100">
              Latest enquiries
            </h2>
            <Link
              href="/admin/leads"
              className="flex items-center gap-1 text-xs font-semibold text-orange-700 hover:underline dark:text-orange-400"
            >
              All leads <ArrowRight size={12} aria-hidden />
            </Link>
          </div>
          {d.recentLeads.length === 0 ? (
            <p className="mt-5 flex flex-col items-center gap-2 rounded-xl border border-dashed border-stone-200 py-8 text-center text-xs text-stone-400 dark:border-stone-800">
              <Inbox size={18} aria-hidden />
              No enquiries in the {period}.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-stone-100 dark:divide-stone-800">
              {d.recentLeads.map((l) => (
                <li key={l.id} className="flex items-baseline justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-stone-800 dark:text-stone-100">
                      {l.name}
                    </span>
                    <span className="block truncate text-xs text-stone-400">
                      {l.services.join(", ") || SOURCE_LABELS[l.source] || l.source}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-stone-400">
                    {l.createdAt.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Ops: still useful, no longer the headline. */}
      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
        <h2 className="font-display text-sm font-bold text-stone-900 dark:text-stone-100">
          Site operations
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Pages in testing", value: d.ops.inTesting, href: "/admin/pages" },
            { label: "Awaiting approval", value: d.ops.awaitingApproval, href: "/admin/pages" },
            { label: "Open bugs", value: d.ops.openBugs, href: "/admin/pages" },
            { label: "Active sessions", value: d.ops.activeSessions, href: "/admin/users" },
            { label: "Ad impressions", value: d.ads.impressions, href: "/admin/ads" },
            {
              label: `Ad clicks · ${d.ads.ctr.toFixed(1)}% CTR`,
              value: d.ads.clicks,
              href: "/admin/ads",
            },
          ].map((s) => (
            <Link key={s.label} href={s.href} className="group">
              <p className="font-display text-2xl font-extrabold text-stone-900 transition-colors group-hover:text-orange-600 dark:text-stone-100">
                {s.value}
              </p>
              <p className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400">
                {s.label}
              </p>
            </Link>
          ))}
        </div>

        {d.ops.openBugs > 0 && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle size={14} aria-hidden className="shrink-0" />
            {d.ops.openBugs} open bug{d.ops.openBugs === 1 ? "" : "s"} on published pages.
          </p>
        )}

        <div className="mt-5 border-t border-stone-100 pt-4 dark:border-stone-800">
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
            Recent admin activity
          </p>
          <ul className="mt-2 space-y-1.5">
            {recentAudit.length === 0 && (
              <li className="text-xs text-stone-400">No activity recorded yet.</li>
            )}
            {recentAudit.map((e) => (
              <li key={e.id} className="flex items-baseline justify-between gap-3 text-xs">
                <span className="truncate text-stone-600 dark:text-stone-300">
                  <span className="font-medium text-stone-800 dark:text-stone-100">
                    {e.user?.name ?? "System"}
                  </span>{" "}
                  {e.action}
                </span>
                <span className="shrink-0 text-stone-400">
                  {e.createdAt.toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
