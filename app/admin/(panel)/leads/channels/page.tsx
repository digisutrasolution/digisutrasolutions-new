import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { leadScopeWhere, userCan } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import { StatTile } from "@/components/admin/dashboard-charts";
import { CHANNEL_CLASS, type Channel } from "@/lib/lead-channel";
import {
  REPORTABLE,
  channelReport,
  withinDays,
  type ChannelRow,
} from "@/lib/lead-channel-server";
import { formatMoney } from "@/lib/quotations";

export const metadata = { title: "Channels" };
export const dynamic = "force-dynamic";

const RANGES = [
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
  { key: "365", label: "12 months" },
  { key: "all", label: "All time" },
] as const;

const pct = (v: number | null) => (v === null ? "—" : `${(v * 100).toFixed(1)}%`);

/* A rate computed from a handful of leads is noise dressed as a number, so
   thin rows are shown greyed with the count that produced them. It is still
   displayed — hiding it would be worse — just not presented as a finding. */
const THIN = 10;

function Rate({ value, of }: { value: number | null; of: number }) {
  const thin = of < THIN;
  return (
    <span
      className={`tabular-nums ${thin ? "text-stone-400 dark:text-stone-500" : "font-semibold"}`}
      title={thin ? `Only ${of} lead${of === 1 ? "" : "s"} — too few to read much into` : undefined}
    >
      {pct(value)}
    </span>
  );
}

function Row({
  label,
  chip,
  sub,
  r,
}: {
  label: string;
  chip?: Channel;
  sub?: string | null;
  r: ChannelRow;
}) {
  return (
    <tr className="border-b border-stone-100 last:border-0 dark:border-stone-800">
      <td className="px-4 py-3">
        {chip ? (
          <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${CHANNEL_CLASS[chip]}`}>
            {label}
          </span>
        ) : (
          <span className="font-medium">{label}</span>
        )}
        {sub && <div className="mt-1 text-[11px] text-stone-500">{sub}</div>}
      </td>
      <td className="px-4 py-3 text-right tabular-nums font-semibold">{r.leads}</td>
      <td className="px-4 py-3 text-right tabular-nums">{r.qualified}</td>
      <td className="px-4 py-3 text-right"><Rate value={r.qualRate} of={r.leads} /></td>
      <td className="px-4 py-3 text-right tabular-nums">{r.won}</td>
      <td className="px-4 py-3 text-right"><Rate value={r.winRate} of={r.leads} /></td>
      <td className="px-4 py-3 text-right tabular-nums text-stone-500">
        {r.pipeline > 0 ? formatMoney(r.pipeline) : "—"}
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        {r.wonValue > 0 ? formatMoney(r.wonValue) : "—"}
      </td>
    </tr>
  );
}

function Head() {
  return (
    <thead>
      <tr className="border-b border-stone-200 text-left text-[11px] uppercase tracking-wide text-stone-400 dark:border-stone-800">
        <th className="px-4 py-2.5 font-semibold">Channel</th>
        <th className="px-4 py-2.5 text-right font-semibold">Leads</th>
        <th className="px-4 py-2.5 text-right font-semibold">Qualified</th>
        <th className="px-4 py-2.5 text-right font-semibold">Qual %</th>
        <th className="px-4 py-2.5 text-right font-semibold">Won</th>
        <th className="px-4 py-2.5 text-right font-semibold">Win %</th>
        <th className="px-4 py-2.5 text-right font-semibold">Open pipeline</th>
        <th className="px-4 py-2.5 text-right font-semibold">Won value</th>
      </tr>
    </thead>
  );
}

export default async function ChannelsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !userCan(user, "leads.manage")) redirect("/admin");

  const { range } = await searchParams;
  const days = RANGES.some((r) => r.key === range) ? range! : "90";

  const where: Prisma.LeadWhereInput = {
    ...REPORTABLE,
    // Same scope rule as the lead list: someone without leads.viewAll reports
    // only on their own leads, never the whole company's.
    ...leadScopeWhere(user),
    ...withinDays(days === "all" ? "all" : Number(days)),
  };

  const { byChannel, byCampaign, total } = await channelReport(where);

  const paid = byChannel.filter((r) =>
    (["Google Ads", "Meta Ads", "Microsoft Ads", "LinkedIn", "Paid other"] as Channel[]).includes(
      r.channel,
    ),
  );
  const paidLeads = paid.reduce((n, r) => n + r.leads, 0);
  const paidWon = paid.reduce((n, r) => n + r.won, 0);
  const allWon = byChannel.reduce((n, r) => n + r.won, 0);
  const untagged = byChannel.find((r) => r.channel === "Direct")?.leads ?? 0;

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Channels &amp; conversion
      </h1>
      <p className="mt-1 max-w-3xl text-sm text-stone-500 dark:text-stone-400">
        Which traffic source actually produces business — not just visits. Every
        lead is placed by its strongest attribution signal: a paid click id
        first, then the UTM tags, then the referring site.{" "}
        <Link href="/admin/analytics" className="text-orange-700 hover:underline dark:text-orange-400">
          Site analytics
        </Link>{" "}
        covers traffic; this page covers what the traffic turned into.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {RANGES.map((r) => (
          <Link
            key={r.key}
            href={`/admin/leads/channels?range=${r.key}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              r.key === days
                ? "bg-orange-600 text-white"
                : "border border-stone-300 text-stone-600 hover:border-stone-400 dark:border-stone-700 dark:text-stone-300"
            }`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Leads in range" value={String(total)} />
        <StatTile
          label="From paid channels"
          value={String(paidLeads)}
          hint={total > 0 ? `${((paidLeads / total) * 100).toFixed(0)}% of all leads` : undefined}
        />
        <StatTile
          label="Won from paid"
          value={String(paidWon)}
          hint={allWon > 0 ? `of ${allWon} won overall` : "none won yet"}
        />
        <StatTile
          label="Untagged (Direct)"
          value={String(untagged)}
          /* Surfaced as a headline number on purpose: a large Direct count
             usually means ad URLs are missing their UTM tags, and every one of
             those is a lead whose real source is unrecoverable. */
          hint={
            untagged > 0 && total > 0
              ? `${((untagged / total) * 100).toFixed(0)}% arrived with no attribution`
              : "every lead carried attribution"
          }
        />
      </div>

      <h2 className="mt-8 font-display text-lg font-bold">By channel</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <table className="w-full min-w-[820px] text-sm">
          <Head />
          <tbody>
            {byChannel.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-stone-500">
                  No leads in this range.
                </td>
              </tr>
            ) : (
              byChannel.map((r) => (
                <Row key={r.channel} label={r.channel} chip={r.channel} sub={r.platform} r={r} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 font-display text-lg font-bold">By campaign</h2>
      <p className="mt-1 text-xs text-stone-500">
        Only leads that arrived with a <code className="rounded bg-stone-100 px-1 dark:bg-stone-800">utm_campaign</code>{" "}
        tag. Untagged leads are counted in the channel table above.
      </p>
      <div className="mt-3 overflow-x-auto rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <table className="w-full min-w-[820px] text-sm">
          <Head />
          <tbody>
            {byCampaign.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-stone-500">
                  No tagged campaigns in this range. Add{" "}
                  <code className="rounded bg-stone-100 px-1 dark:bg-stone-800">utm_campaign</code>{" "}
                  to your ad URLs and they will appear here.
                </td>
              </tr>
            ) : (
              byCampaign.map((r) => (
                <Row key={r.campaign} label={r.campaign} sub={r.channel} r={r} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
