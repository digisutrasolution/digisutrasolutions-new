import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { clientIp } from "@/lib/rate-limit";
import { getChannelsConfig, saveChannelsConfig, channelsAvailability } from "@/lib/channels-config-server";

/** Contact-channel config (SMS messaging + Telegram) and what's deliverable. */
export async function GET() {
  const { error } = await requirePermission("settings.manage");
  if (error) return error;
  const config = await getChannelsConfig(true);
  return NextResponse.json({ ok: true, config, availability: await channelsAvailability(config) });
}

export async function PUT(req: Request) {
  const { user, error } = await requirePermission("settings.manage");
  if (error) return error;
  const body = await req.json().catch(() => null);
  const config = await saveChannelsConfig(body?.config ?? body);
  audit({
    userId: user.id,
    action: "channels.config.update",
    entity: "settings",
    entityId: "channels",
    meta: { sms: config.sms.enabled, tgDeepLink: config.telegram.deepLink, tgAlerts: config.telegram.alerts },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, config, availability: await channelsAvailability(config) });
}
