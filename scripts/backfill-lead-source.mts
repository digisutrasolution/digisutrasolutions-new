/* Backfill Lead.source from attribution already stored on the row.
 *
 * Until now every lead was filed by which form it came through — the contact
 * API wrote AUDIT, dynamic forms wrote FORM, everything else CONTACT — so the
 * paid values in the enum (GOOGLE_ADS, PPC, FACEBOOK, LINKEDIN) were never
 * written by anything. Two consequences: channel reporting could not be built
 * on the field, and scoring's 15-point `paidIntent` signal could never fire.
 *
 * Intake now derives it (see lib/lead-channel.ts). This applies the same rule
 * to rows created before that, using the UTM and click-id columns they
 * already carry.
 *
 * Safe to re-run: it only writes rows whose derived source differs from what
 * is stored, and it only ever writes a PAID value. A lead whose attribution
 * says nothing is left exactly as it is.
 *
 * Run with tsx, not node — it imports the real rule from lib rather than
 * keeping a second copy that could drift from what intake writes:
 *
 *   npx tsx scripts/backfill-lead-source.mts --dry   # report only
 *   npx tsx scripts/backfill-lead-source.mts         # apply
 */
import { PrismaClient, type LeadSource } from "@prisma/client";
import { deriveChannel, sourceFromChannel } from "../lib/lead-channel";

const dry = process.argv.includes("--dry");
const db = new PrismaClient();

const leads = await db.lead.findMany({
  // Soft-deleted rows are excluded: they are invisible everywhere else, and
  // rewriting them would silently change what a restore brings back.
  where: { deletedAt: null },
  select: {
    id: true, source: true,
    utmSource: true, utmMedium: true, utmCampaign: true,
    gclid: true, fbclid: true, msclkid: true, referrer: true,
  },
});

const changes: { id: string; from: string; to: LeadSource }[] = [];
const byChannel = new Map<string, number>();
for (const l of leads) {
  const d = deriveChannel(l);
  byChannel.set(d.channel, (byChannel.get(d.channel) ?? 0) + 1);
  const next = sourceFromChannel(d);
  if (next && next !== l.source) changes.push({ id: l.id, from: l.source, to: next });
}

console.log(`\nScanned ${leads.length} live leads.\n`);
console.log("Derived channel spread:");
for (const [c, n] of [...byChannel.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(5)}  ${c}`);
}

if (changes.length === 0) {
  console.log("\nNothing to change — no stored attribution implies a paid source.");
} else {
  const spread = new Map<string, number>();
  for (const c of changes) {
    const k = `${c.from} → ${c.to}`;
    spread.set(k, (spread.get(k) ?? 0) + 1);
  }
  console.log(`\n${changes.length} lead(s) would change source:`);
  for (const [k, n] of [...spread.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(5)}  ${k}`);
  }

  if (dry) {
    console.log("\n--dry: nothing written.");
  } else {
    /* Grouped by target value so this is a handful of updateMany calls
       instead of one round trip per lead. */
    const byTarget = new Map<LeadSource, string[]>();
    for (const c of changes) {
      const list = byTarget.get(c.to) ?? [];
      list.push(c.id);
      byTarget.set(c.to, list);
    }
    let written = 0;
    for (const [to, ids] of byTarget) {
      const r = await db.lead.updateMany({ where: { id: { in: ids } }, data: { source: to } });
      written += r.count;
    }
    console.log(`\nWrote ${written} row(s).`);
    console.log(
      "Scores are NOT recomputed here — they are stored per lead. Re-save a " +
      "lead, or run the scoring recalculation, to pick up the paidIntent points.",
    );
  }
}

await db.$disconnect();
