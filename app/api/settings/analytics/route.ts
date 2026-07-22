import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { AnalyticsSchema, DEFAULT_ANALYTICS } from "@/lib/analytics";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

export async function GET() {
  const { error } = await requirePermission("settings.manage");
  if (error) return error;
  const setting = await db.siteSetting.findUnique({ where: { key: "analytics" } });
  const parsed = AnalyticsSchema.safeParse(setting?.value);
  return NextResponse.json({
    ok: true,
    analytics: parsed.success ? parsed.data : DEFAULT_ANALYTICS,
  });
}

export async function PUT(req: Request) {
  const { user, error } = await requirePermission("settings.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = AnalyticsSchema.safeParse(body?.analytics);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid settings." },
      { status: 400 },
    );
  }

  await db.siteSetting.upsert({
    where: { key: "analytics" },
    create: { key: "analytics", value: parsed.data },
    update: { value: parsed.data },
  });

  /* Which vendors are on is worth an audit trail; the IDs are not secrets
     but they identify accounts, so only presence is logged. */
  audit({
    userId: user.id,
    action: "settings.analytics.update",
    entity: "siteSetting",
    entityId: "analytics",
    meta: {
      enabled: parsed.data.enabled,
      vendors: Object.entries({
        ga4: parsed.data.ga4Id,
        gtm: parsed.data.gtmId,
        metaPixel: parsed.data.metaPixelId,
        clarity: parsed.data.clarityId,
      })
        .filter(([, v]) => v)
        .map(([k]) => k),
    },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, analytics: parsed.data });
}
