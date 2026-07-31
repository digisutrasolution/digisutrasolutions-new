import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { clientIp } from "@/lib/rate-limit";
import { getAiConfig, saveAiConfig, providerAvailability } from "@/lib/ai-config-server";

/** Current AI provider config + which credentials are present (never the keys). */
export async function GET() {
  const { error } = await requirePermission("settings.manage");
  if (error) return error;
  const config = await getAiConfig(true);
  return NextResponse.json({ ok: true, config, availability: providerAvailability(config) });
}

export async function PUT(req: Request) {
  const { user, error } = await requirePermission("settings.manage");
  if (error) return error;
  const body = await req.json().catch(() => null);
  const config = await saveAiConfig(body?.config ?? body);
  audit({ userId: user.id, action: "ai.config.update", entity: "settings", entityId: "ai", meta: { order: config.providers.map((p) => `${p.id}${p.enabled ? "" : "(off)"}`) }, ip: clientIp(req) });
  return NextResponse.json({ ok: true, config, availability: providerAvailability(config) });
}
