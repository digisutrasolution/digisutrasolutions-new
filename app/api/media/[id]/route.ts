import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { deleteStoredFile } from "@/lib/storage";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

const UpdateSchema = z.object({ alt: z.string().trim().max(300) });

export async function PATCH(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("media.upload");
  if (error) return error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid alt text." },
      { status: 400 },
    );
  }

  const asset = await db.mediaAsset.update({
    where: { id },
    data: { alt: parsed.data.alt },
  }).catch(() => null);
  if (!asset) {
    return NextResponse.json(
      { ok: false, error: "Asset not found." },
      { status: 404 },
    );
  }

  audit({
    userId: user.id,
    action: "media.update",
    entity: "media",
    entityId: id,
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, asset });
}

export async function DELETE(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("media.upload");
  if (error) return error;
  const { id } = await params;

  const asset = await db.mediaAsset.findUnique({ where: { id } });
  if (!asset) {
    return NextResponse.json(
      { ok: false, error: "Asset not found." },
      { status: 404 },
    );
  }

  await db.mediaAsset.delete({ where: { id } });
  await deleteStoredFile(asset.filename, asset.url);

  audit({
    userId: user.id,
    action: "media.delete",
    entity: "media",
    entityId: id,
    meta: { filename: asset.filename },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
