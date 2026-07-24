import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fromHeader, sendViaSmtp, verifySmtp } from "@/lib/mailer";
import { getSmtp, SmtpSchema } from "@/lib/smtp";

export const runtime = "nodejs";

/* Optional draft settings so the form can be tested BEFORE saving, plus an
   optional address to send a real probe message to. */
const TestSchema = z.object({
  smtp: SmtpSchema.partial().optional(),
  sendTo: z.string().trim().email().optional(),
});

export async function POST(req: Request) {
  const { user, error } = await requirePermission("settings.manage");
  if (error) return error;

  // Connecting to arbitrary host:port is a useful probe for an attacker who
  // gets an admin session, so cap how often it can be driven.
  const limited = rateLimit(`smtp-test:${user.id}`, 10, 10 * 60_000);
  if (!limited.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: `Too many tests — try again in ${limited.retryAfterSec}s.`,
      },
      { status: 429 },
    );
  }

  const parsed = TestSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });
  }

  /* Merge any unsaved form values over the stored ones. A blank password in
     the draft means "use the saved password", mirroring the PUT contract —
     otherwise testing an unsaved form would always fail on auth. */
  const stored = await getSmtp();
  const draft = parsed.data.smtp ?? {};
  const settings = {
    ...stored,
    ...draft,
    password:
      draft.password && draft.password.length > 0 ? draft.password : stored.password,
  };

  if (!settings.host) {
    return NextResponse.json({ ok: false, error: "Host is required." }, { status: 400 });
  }

  const verified = await verifySmtp(settings);
  if (!verified.ok) {
    audit({
      userId: user.id,
      action: "settings.smtp.test",
      entity: "setting",
      entityId: "smtp",
      meta: { host: settings.host, port: settings.port, result: "failed" },
      ip: clientIp(req),
    });
    return NextResponse.json({ ok: false, error: verified.error });
  }

  // Connection is good; optionally prove delivery end to end.
  if (parsed.data.sendTo) {
    if (!settings.fromEmail) {
      return NextResponse.json({
        ok: false,
        error: "Connected, but a From address is required to send a test email.",
      });
    }
    const sent = await sendViaSmtp({
      to: [parsed.data.sendTo],
      subject: "DigiSutra CMS — SMTP test",
      text: `This is a test message from the DigiSutra CMS.\n\nIf you received it, outgoing email is working.\n\nHost: ${settings.host}:${settings.port}\nFrom: ${fromHeader(settings)}`,
    });
    if (!sent.ok) {
      return NextResponse.json({
        ok: false,
        error: `Connected and authenticated, but sending failed: ${sent.error}`,
      });
    }
  }

  audit({
    userId: user.id,
    action: "settings.smtp.test",
    entity: "setting",
    entityId: "smtp",
    meta: {
      host: settings.host,
      port: settings.port,
      result: "ok",
      sentTo: parsed.data.sendTo ? "yes" : "no",
    },
    ip: clientIp(req),
  });

  return NextResponse.json({
    ok: true,
    message: parsed.data.sendTo
      ? `Connected and test email sent to ${parsed.data.sendTo}.`
      : "Connected and authenticated successfully.",
  });
}
