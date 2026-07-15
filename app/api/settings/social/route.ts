import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

const KEYS = ["whatsapp", "linkedin", "instagram", "youtube", "facebook", "x"] as const;

const LinksSchema = z
  .array(
    z.object({
      key: z.enum(KEYS),
      label: z.string().trim().min(1).max(60),
      followers: z.string().trim().max(30).optional(),
      url: z.string().trim().url().max(400),
    }),
  )
  .max(6);

export async function GET() {
  const { error } = await requirePermission("settings.manage");
  if (error) return error;
  const setting = await db.siteSetting.findUnique({ where: { key: "socialLinks" } });
  return NextResponse.json({ ok: true, links: setting?.value ?? [] });
}

export async function PUT(req: Request) {
  const { user, error } = await requirePermission("settings.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = LinksSchema.safeParse(body?.links);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid links." },
      { status: 400 },
    );
  }

  await db.siteSetting.upsert({
    where: { key: "socialLinks" },
    create: { key: "socialLinks", value: parsed.data },
    update: { value: parsed.data },
  });

  audit({
    userId: user.id,
    action: "settings.social.update",
    entity: "siteSetting",
    entityId: "socialLinks",
    meta: { count: parsed.data.length },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, links: parsed.data });
}
