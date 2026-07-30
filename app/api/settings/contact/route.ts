import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { ContactSchema, DEFAULT_CONTACT } from "@/lib/contact-config";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export async function GET() {
  const { error } = await requirePermission("settings.manage");
  if (error) return error;
  const row = await db.siteSetting.findUnique({ where: { key: "contact" } });
  const parsed = ContactSchema.safeParse(row?.value);
  return NextResponse.json({ ok: true, contact: parsed.success ? parsed.data : DEFAULT_CONTACT });
}

export async function PUT(req: Request) {
  const { user, error } = await requirePermission("settings.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = ContactSchema.safeParse(body?.contact);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid contact settings." },
      { status: 400 },
    );
  }

  await db.siteSetting.upsert({
    where: { key: "contact" },
    create: { key: "contact", value: parsed.data as unknown as Prisma.InputJsonValue },
    update: { value: parsed.data as unknown as Prisma.InputJsonValue },
  });

  audit({ userId: user.id, action: "settings.update", entity: "setting", entityId: "contact", ip: clientIp(req) });
  return NextResponse.json({ ok: true });
}
