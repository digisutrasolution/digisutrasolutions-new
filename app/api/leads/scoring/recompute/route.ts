import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { clientIp } from "@/lib/rate-limit";
import { recomputeAllScores } from "@/lib/scoring-server";

/** Rescore every live lead against the current config. */
export async function POST(req: Request) {
  const { user, error } = await requirePermission("leads.rules");
  if (error) return error;
  const count = await recomputeAllScores();
  audit({ userId: user.id, action: "scoring.recompute", entity: "lead", entityId: `${count} leads`, ip: clientIp(req) });
  return NextResponse.json({ ok: true, count });
}
