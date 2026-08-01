import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { clientIp } from "@/lib/rate-limit";
import { getOtpConfig, saveOtpConfig, otpAvailability } from "@/lib/otp-config-server";

/** Current verification config + which channels can actually deliver. */
export async function GET() {
  const { error } = await requirePermission("settings.manage");
  if (error) return error;
  const config = await getOtpConfig(true);
  return NextResponse.json({ ok: true, config, availability: await otpAvailability(config) });
}

export async function PUT(req: Request) {
  const { user, error } = await requirePermission("settings.manage");
  if (error) return error;
  const body = await req.json().catch(() => null);
  const config = await saveOtpConfig(body?.config ?? body);
  audit({
    userId: user.id,
    action: "otp.config.update",
    entity: "settings",
    entityId: "otp",
    meta: { enabled: config.enabled, policy: config.channelPolicy, sms: config.sms.enabled ? config.sms.transport : "off" },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, config, availability: await otpAvailability(config) });
}
