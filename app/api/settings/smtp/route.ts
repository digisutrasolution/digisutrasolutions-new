import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { getSmtp, maskSmtp, SmtpSchema, SMTP_KEY } from "@/lib/smtp";

export const runtime = "nodejs";

export async function GET() {
  const { error } = await requirePermission("settings.manage");
  if (error) return error;
  // maskSmtp swaps the password for a boolean — the value never leaves here.
  return NextResponse.json({ ok: true, smtp: maskSmtp(await getSmtp()) });
}

export async function PUT(req: Request) {
  const { user, error } = await requirePermission("settings.manage");
  if (error) return error;

  const parsed = SmtpSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  /* A blank password means "leave the stored one alone". Without this the
     admin form — which never receives the password — would wipe it on every
     save. */
  const current = await getSmtp();
  const value = {
    ...parsed.data,
    password: parsed.data.password.length > 0 ? parsed.data.password : current.password,
  };

  await db.siteSetting.upsert({
    where: { key: SMTP_KEY },
    update: { value },
    create: { key: SMTP_KEY, value },
  });

  audit({
    userId: user.id,
    action: "settings.smtp.update",
    entity: "setting",
    entityId: SMTP_KEY,
    // Never log the credentials themselves.
    meta: {
      enabled: value.enabled,
      host: value.host,
      port: value.port,
      secure: value.secure,
      passwordChanged: parsed.data.password.length > 0,
    },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, smtp: maskSmtp(value) });
}
