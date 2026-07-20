import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { DEFAULT_FOOTER_INFO, FooterInfoSchema } from "@/lib/footer";
import { clientIp } from "@/lib/rate-limit";

export async function GET() {
  const { error } = await requirePermission("settings.manage");
  if (error) return error;
  const setting = await db.siteSetting.findUnique({ where: { key: "footerInfo" } });
  return NextResponse.json({
    ok: true,
    info: { ...DEFAULT_FOOTER_INFO, ...(setting?.value as object | undefined) },
  });
}

export async function PUT(req: Request) {
  const { user, error } = await requirePermission("settings.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = FooterInfoSchema.safeParse(body?.info);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid footer info." },
      { status: 400 },
    );
  }

  await db.siteSetting.upsert({
    where: { key: "footerInfo" },
    create: { key: "footerInfo", value: parsed.data },
    update: { value: parsed.data },
  });

  audit({
    userId: user.id,
    action: "settings.footer.update",
    entity: "siteSetting",
    entityId: "footerInfo",
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, info: parsed.data });
}
