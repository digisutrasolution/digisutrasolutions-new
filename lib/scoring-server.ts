import "server-only";
import { db } from "@/lib/db";
import { logLeadActivity } from "@/lib/crm-server";
import {
  computeScore,
  mergeScoringConfig,
  type ScoreResult,
  type ScoringConfig,
} from "@/lib/scoring";

const SETTING_KEY = "scoring";
const TTL_MS = 15_000;

let cached: ScoringConfig | null = null;
let loadedAt = 0;

/** Current scoring config (cached), falling back to defaults. */
export async function getScoringConfig(force = false): Promise<ScoringConfig> {
  if (!force && cached && Date.now() - loadedAt < TTL_MS) return cached;
  try {
    const row = await db.siteSetting.findUnique({ where: { key: SETTING_KEY } });
    cached = mergeScoringConfig(row?.value);
  } catch {
    cached = mergeScoringConfig(null);
  }
  loadedAt = Date.now();
  return cached;
}

export async function saveScoringConfig(raw: unknown): Promise<ScoringConfig> {
  const clean = mergeScoringConfig(raw);
  await db.siteSetting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: clean },
    update: { value: clean },
  });
  cached = clean;
  loadedAt = Date.now();
  return clean;
}

/** Recompute and persist one lead's score. Logs a timeline note when the band
    changes. Best-effort: scoring must never break the action that triggered it. */
export async function scoreAndSave(leadId: string, logBandChange = true): Promise<ScoreResult | null> {
  try {
    const [cfg, lead, activityCount] = await Promise.all([
      getScoringConfig(),
      db.lead.findUnique({
        where: { id: leadId },
        select: {
          email: true, company: true, website: true, budget: true,
          expectedRevenue: true, priority: true, source: true, services: true,
          message: true, score: true,
        },
      }),
      db.leadActivity.count({ where: { leadId } }),
    ]);
    if (!lead) return null;

    const prevBand = lead.score == null ? null : bandFor(lead.score, cfg);
    const result = computeScore({ ...lead, activityCount }, cfg);
    await db.lead.update({ where: { id: leadId }, data: { score: result.score } });

    if (logBandChange && prevBand !== result.band) {
      void logLeadActivity({
        leadId,
        type: "score",
        message: `Lead scored ${result.score}/100 · ${result.band}`,
      });
    }
    return result;
  } catch (err) {
    console.error("scoreAndSave failed:", err);
    return null;
  }
}

function bandFor(score: number, cfg: ScoringConfig): "HOT" | "WARM" | "COLD" {
  if (score >= cfg.hotMin) return "HOT";
  if (score >= cfg.warmMin) return "WARM";
  return "COLD";
}

/** Rescore every live lead (used by the "recompute all" admin action). */
export async function recomputeAllScores(): Promise<number> {
  const cfg = await getScoringConfig(true);
  const leads = await db.lead.findMany({
    where: { deletedAt: null },
    select: {
      id: true, email: true, company: true, website: true, budget: true,
      expectedRevenue: true, priority: true, source: true, services: true, message: true,
    },
  });
  const counts = await db.leadActivity.groupBy({
    by: ["leadId"],
    _count: { leadId: true },
  });
  const countMap = new Map(counts.map((c) => [c.leadId, c._count.leadId]));

  let updated = 0;
  for (const lead of leads) {
    const { score } = computeScore({ ...lead, activityCount: countMap.get(lead.id) ?? 0 }, cfg);
    await db.lead.update({ where: { id: lead.id }, data: { score } });
    updated++;
  }
  return updated;
}
