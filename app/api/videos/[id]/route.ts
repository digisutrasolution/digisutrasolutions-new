import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

const UpdateVideoSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().max(2000).optional(),
    category: z.string().trim().min(1).max(60).optional(),
    durationSec: z.number().int().positive().max(86400).nullable().optional(),
    featured: z.boolean().optional(),
    thumbnailUrl: z.string().trim().max(500).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Nothing to update." });

export async function PATCH(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("videos.manage");
  if (error) return error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = UpdateVideoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const video = await db.video
    .update({ where: { id }, data: parsed.data })
    .catch(() => null);
  if (!video) {
    return NextResponse.json(
      { ok: false, error: "Video not found." },
      { status: 404 },
    );
  }

  audit({
    userId: user.id,
    action: "video.update",
    entity: "video",
    entityId: id,
    meta: { fields: Object.keys(parsed.data) },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, video });
}

export async function DELETE(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("videos.manage");
  if (error) return error;
  const { id } = await params;

  const video = await db.video.findUnique({ where: { id } });
  if (!video) {
    return NextResponse.json(
      { ok: false, error: "Video not found." },
      { status: 404 },
    );
  }
  await db.video.delete({ where: { id } });
  audit({
    userId: user.id,
    action: "video.delete",
    entity: "video",
    entityId: id,
    meta: { slug: video.slug },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
