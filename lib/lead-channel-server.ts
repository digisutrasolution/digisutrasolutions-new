import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { CHANNELS, deriveChannel, type Channel } from "@/lib/lead-channel";

/* Server-side reads over the channel rule.

   Both the list filter and the channel report go through deriveChannel rather
   than reimplementing it as SQL. Expressing "Google Ads" as a where-clause is
   possible — a gclid OR a google/cpc utm pair OR … — but it would be a second
   copy of the rule that has to be kept in step with the first by hand, and the
   day they disagree the list and the report quietly stop matching.

   The cost is loading the attribution columns for the matching set instead of
   filtering in the database. Those are seven short strings per row and nothing
   else, which is far cheaper than it sounds and is the same order of data the
   CSV export already pulls. */

const ATTR_SELECT = {
  id: true,
  utmSource: true,
  utmMedium: true,
  utmCampaign: true,
  gclid: true,
  fbclid: true,
  msclkid: true,
  referrer: true,
} satisfies Prisma.LeadSelect;

/** Guard against an arbitrary ?channel= string reaching the report. */
export function isChannel(v: string | null | undefined): v is Channel {
  return !!v && (CHANNELS as string[]).includes(v);
}

/**
 * Ids of the leads matching `where` whose derived channel is `channel`.
 *
 * Capped: a filter that silently truncates is worse than one that admits it,
 * so the caller gets `capped` and can say so in the UI.
 */
export async function leadIdsForChannel(
  where: Prisma.LeadWhereInput,
  channel: Channel,
  cap = 20_000,
): Promise<{ ids: string[]; capped: boolean }> {
  const rows = await db.lead.findMany({
    where,
    select: ATTR_SELECT,
    orderBy: { createdAt: "desc" },
    take: cap + 1,
  });
  const capped = rows.length > cap;
  const ids = (capped ? rows.slice(0, cap) : rows)
    .filter((r) => deriveChannel(r).channel === channel)
    .map((r) => r.id);
  return { ids, capped };
}

/**
 * A createdAt filter for the last `days`, or {} for all time.
 *
 * Lives here rather than in the page because reading the clock during a
 * component render is impure — react-hooks/purity rejects it, and rightly:
 * the same render would produce a different boundary each time.
 */
export function withinDays(days: number | "all"): Prisma.LeadWhereInput {
  if (days === "all") return {};
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));
  return { createdAt: { gte: since } };
}

export type ChannelRow = {
  channel: Channel;
  platform: string | null;
  leads: number;
  qualified: number;
  won: number;
  lost: number;
  /** Won ÷ leads. Null when there are no leads, never a fake 0%. */
  winRate: number | null;
  /** Qualified ÷ leads — the earlier, higher-volume signal. */
  qualRate: number | null;
  /** Summed expectedRevenue of everything not lost. */
  pipeline: number;
  wonValue: number;
};

/* Anything that means "this turned into a real sales conversation". MEETING
   is in the list because a booked meeting is at least as qualified as
   QUALIFIED; FOLLOW_UP and HOLD are not, because both are routinely used
   before anyone has judged the lead. */
const QUALIFIED_PLUS = new Set([
  "QUALIFIED",
  "MEETING",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
]);

/* Junk never counts. Leaving SPAM and DUPLICATE in would inflate the lead
   count of whichever channel attracts the most bots and depress its
   conversion rate for a reason that has nothing to do with the channel. */
export const REPORTABLE: Prisma.LeadWhereInput = {
  deletedAt: null,
  status: { notIn: ["SPAM", "DUPLICATE"] },
};

type ReportRow = {
  channel: Channel;
  platform: string | null;
  campaign: string | null;
  status: string;
  expectedRevenue: number | null;
};

async function load(where: Prisma.LeadWhereInput, cap: number) {
  const rows = await db.lead.findMany({
    where,
    select: { ...ATTR_SELECT, status: true, expectedRevenue: true },
    orderBy: { createdAt: "desc" },
    take: cap,
  });
  return rows.map<ReportRow>((r) => {
    const d = deriveChannel(r);
    return {
      channel: d.channel,
      platform: d.platform,
      campaign: d.campaign,
      status: r.status,
      expectedRevenue: r.expectedRevenue,
    };
  });
}

function fold<K extends string>(
  rows: ReportRow[],
  key: (r: ReportRow) => K | null,
): Map<K, ChannelRow & { key: K }> {
  const out = new Map<K, ChannelRow & { key: K }>();
  for (const r of rows) {
    const k = key(r);
    if (k === null) continue;
    let row = out.get(k);
    if (!row) {
      row = {
        key: k,
        channel: r.channel,
        platform: r.platform,
        leads: 0, qualified: 0, won: 0, lost: 0,
        winRate: null, qualRate: null, pipeline: 0, wonValue: 0,
      };
      out.set(k, row);
    }
    row.leads++;
    if (QUALIFIED_PLUS.has(r.status)) row.qualified++;
    if (r.status === "WON") { row.won++; row.wonValue += r.expectedRevenue ?? 0; }
    else if (r.status === "LOST") row.lost++;
    else row.pipeline += r.expectedRevenue ?? 0;
  }
  for (const row of out.values()) {
    row.winRate = row.leads > 0 ? row.won / row.leads : null;
    row.qualRate = row.leads > 0 ? row.qualified / row.leads : null;
  }
  return out;
}

/**
 * Leads grouped by channel, and separately by campaign.
 *
 * One pass over the same rows produces both, so the two tables can never
 * disagree about a total.
 */
export async function channelReport(
  where: Prisma.LeadWhereInput,
  cap = 20_000,
): Promise<{
  byChannel: ChannelRow[];
  byCampaign: (ChannelRow & { campaign: string })[];
  total: number;
}> {
  const rows = await load(where, cap);

  const byChannel = [...fold(rows, (r) => r.channel).values()].sort(
    (a, b) => b.leads - a.leads,
  );

  /* Untagged leads are excluded from the campaign table rather than bucketed
     as "(none)" — a campaign report whose biggest row is "no campaign" buries
     the rows you opened it to read. The channel table above still counts
     every lead, so nothing goes missing. */
  const byCampaign = [...fold(rows, (r) => r.campaign).values()]
    .map((r) => ({ ...r, campaign: r.key }))
    .sort((a, b) => b.leads - a.leads);

  return { byChannel, byCampaign, total: rows.length };
}
