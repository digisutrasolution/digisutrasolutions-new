import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { clientIp } from "@/lib/rate-limit";
import { getSmsGateway, saveSmsGateway } from "@/lib/sms-config-server";
import { smsGatewayReady } from "@/lib/sms";

/** The shared SMS gateway (used by OTP + lead messaging), configured near SMTP. */
export async function GET() {
  const { error } = await requirePermission("settings.manage");
  if (error) return error;
  const config = await getSmsGateway(true);
  return NextResponse.json({ ok: true, config, ready: smsGatewayReady(config) });
}

export async function PUT(req: Request) {
  const { user, error } = await requirePermission("settings.manage");
  if (error) return error;
  const body = await req.json().catch(() => null);
  const config = await saveSmsGateway(body?.config ?? body);
  audit({
    userId: user.id,
    action: "sms.gateway.update",
    entity: "settings",
    entityId: "sms-gateway",
    meta: { transport: config.transport, hasUrl: !!config.http.url },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, config, ready: smsGatewayReady(config) });
}
