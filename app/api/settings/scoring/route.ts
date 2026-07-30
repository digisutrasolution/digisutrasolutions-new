import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { clientIp } from "@/lib/rate-limit";
import { getScoringConfig, saveScoringConfig } from "@/lib/scoring-server";

/** Current lead-scoring config (band thresholds + per-signal weights). */
export async function GET() {
  const { error } = await requirePermission("leads.rules");
  if (error) return error;
  const config = await getScoringConfig(true);
  return NextResponse.json({ ok: true, config });
}

export async function PUT(req: Request) {
  const { user, error } = await requirePermission("leads.rules");
  if (error) return error;
  const body = await req.json().catch(() => null);
  const config = await saveScoringConfig(body?.config ?? body);
  audit({
    userId: user.id,
    action: "scoring.update",
    entity: "settings",
    entityId: "scoring",
    meta: { hotMin: config.hotMin, warmMin: config.warmMin },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, config });
}
