import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { getOtpConfig } from "@/lib/otp-config-server";
import { issueChallenge } from "@/lib/otp";

/** Admin: send a live test code to a given email or phone through the current
    config, so the owner can confirm delivery before turning verification on. */
export async function POST(req: Request) {
  const { error } = await requirePermission("settings.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const channel = body?.channel === "sms" ? "sms" : "email";
  const target = typeof body?.target === "string" ? body.target.trim() : "";
  if (!target) return NextResponse.json({ ok: false, reason: "Enter a test recipient." }, { status: 400 });

  // Force the chosen channel on regardless of the saved policy, so a Test
  // always exercises exactly the transport the admin is checking.
  const base = await getOtpConfig(true);
  const cfg = {
    ...base,
    enabled: true,
    channelPolicy: channel as "email" | "sms",
    email: { ...base.email, enabled: channel === "email" ? true : base.email.enabled },
    sms: { ...base.sms, enabled: channel === "sms" ? true : base.sms.enabled },
  };

  const result = await issueChallenge(
    channel === "email" ? { email: target } : { phone: target },
    cfg,
  );
  if (!result.sent) return NextResponse.json({ ok: false, reason: result.reason });
  return NextResponse.json({ ok: true, target: result.challenge.target, channel: result.challenge.channel });
}
