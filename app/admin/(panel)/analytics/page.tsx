import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";

export const metadata = { title: "Analytics" };

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

export default async function AdminAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "analytics.view")) redirect("/admin");

  const [today, last7, last30, topPages, topReferrers, daily, content] =
    await Promise.all([
      db.pageView.count({ where: { createdAt: { gte: daysAgo(0) } } }),
      db.pageView.count({ where: { createdAt: { gte: daysAgo(7) } } }),
      db.pageView.count({ where: { createdAt: { gte: daysAgo(30) } } }),
      db.pageView.groupBy({
        by: ["path"],
        where: { createdAt: { gte: daysAgo(30) } },
        _count: { _all: true },
        orderBy: { _count: { path: "desc" } },
        take: 10,
      }),
      db.pageView.groupBy({
        by: ["referrer"],
        where: { createdAt: { gte: daysAgo(30) }, referrer: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { referrer: "desc" } },
        take: 8,
      }),
      db.$queryRaw<Array<{ day: Date; views: bigint }>>`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS views
        FROM "PageView"
        WHERE "createdAt" >= NOW() - INTERVAL '14 days'
        GROUP BY 1 ORDER BY 1
      `,
      Promise.all([
        db.page.count({ where: { status: "PUBLISHED" } }),
        db.blogPost.count({ where: { status: "PUBLISHED" } }),
        db.formSubmission.count(),
        db.mediaAsset.count(),
        db.aiGeneration.count(),
      ]),
    ]);

  const [publishedPages, publishedPosts, submissions, mediaCount, aiCount] = content;
  const maxDaily = Math.max(1, ...daily.map((d) => Number(d.views)));

  const stats = [
    { label: "Views today", value: today },
    { label: "Views (7 days)", value: last7 },
    { label: "Views (30 days)", value: last30 },
    { label: "Form submissions", value: submissions },
    { label: "AI generations", value: aiCount },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Analytics
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        First-party, cookie-less page views from the public site.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
            <p className="font-display text-3xl font-extrabold text-orange-600">{s.value}</p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
        <h2 className="font-display text-sm font-bold">Daily views — last 14 days</h2>
        {daily.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">No views recorded yet — browse the public site to generate data.</p>
        ) : (
          <div className="mt-4 flex h-32 items-end gap-1.5">
            {daily.map((d) => {
              const views = Number(d.views);
              return (
                <div key={d.day.toISOString()} className="group flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] text-stone-400 opacity-0 transition-opacity group-hover:opacity-100">{views}</span>
                  <div
                    className="w-full rounded-t bg-orange-500 transition-colors group-hover:bg-orange-600"
                    style={{ height: `${Math.max(4, (views / maxDaily) * 100)}%` }}
                    title={`${d.day.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: ${views}`}
                  />
                  <span className="text-[10px] text-stone-400">
                    {d.day.toLocaleDateString("en-IN", { day: "numeric" })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="font-display text-sm font-bold">Top pages — 30 days</h2>
          <ul className="mt-4 space-y-2">
            {topPages.length === 0 && <li className="text-sm text-stone-500">No data yet.</li>}
            {topPages.map((p) => (
              <li key={p.path} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-mono text-xs">{p.path}</span>
                <span className="shrink-0 font-semibold text-orange-700 dark:text-orange-400">{p._count._all}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
            <h2 className="font-display text-sm font-bold">Top referrers — 30 days</h2>
            <ul className="mt-4 space-y-2">
              {topReferrers.length === 0 && <li className="text-sm text-stone-500">No external referrers yet.</li>}
              {topReferrers.map((r) => (
                <li key={r.referrer} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate">{r.referrer}</span>
                  <span className="shrink-0 font-semibold text-orange-700 dark:text-orange-400">{r._count._all}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
            <h2 className="font-display text-sm font-bold">Content</h2>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex justify-between"><span>Published pages</span><span className="font-semibold">{publishedPages}</span></li>
              <li className="flex justify-between"><span>Published articles</span><span className="font-semibold">{publishedPosts}</span></li>
              <li className="flex justify-between"><span>Media assets</span><span className="font-semibold">{mediaCount}</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
