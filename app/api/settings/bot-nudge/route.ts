import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { BotNudgeSchema, DEFAULT_BOT_NUDGE } from "@/lib/bot-nudge";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

export async function GET() {
  const { error } = await requirePermission("settings.manage");
  if (error) return error;
  const setting = await db.siteSetting.findUnique({ where: { key: "botNudge" } });
  const parsed = BotNudgeSchema.safeParse(setting?.value);
  return NextResponse.json({ ok: true, nudge: parsed.success ? parsed.data : DEFAULT_BOT_NUDGE });
}

export async function PUT(req: Request) {
  const { user, error } = await requirePermission("settings.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = BotNudgeSchema.safeParse(body?.nudge);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid nudge settings." },
      { status: 400 },
    );
  }

  await db.siteSetting.upsert({
    where: { key: "botNudge" },
    create: { key: "botNudge", value: parsed.data },
    update: { value: parsed.data },
  });

  audit({
    userId: user.id,
    action: "settings.botNudge.update",
    entity: "siteSetting",
    entityId: "botNudge",
    meta: { enabled: parsed.data.enabled, rules: parsed.data.rules.length },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, nudge: parsed.data });
}
