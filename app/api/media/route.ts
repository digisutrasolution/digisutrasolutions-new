import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { saveImage } from "@/lib/storage";
import { audit } from "@/lib/audit";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
]);

export async function GET() {
  const { error } = await requirePermission("pages.view");
  if (error) return error;
  const assets = await db.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ ok: true, assets });
}

export async function POST(req: Request) {
  const { user, error } = await requirePermission("media.upload");
  if (error) return error;

  const ip = clientIp(req);
  const limited = rateLimit(`upload:${user.id}`, 30, 10 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many uploads — slow down." },
      { status: 429 },
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "Attach a file field named 'file'." },
      { status: 400 },
    );
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { ok: false, error: "Only JPG, PNG, WebP, AVIF, GIF or SVG images are allowed." },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "File is larger than 10 MB." },
      { status: 413 },
    );
  }

  const alt = String(form?.get("alt") ?? "").trim().slice(0, 300);
  const buffer = Buffer.from(await file.arrayBuffer());

  let stored;
  try {
    stored = await saveImage(buffer, file.name, file.type);
  } catch (err) {
    console.error("media processing failed:", err);
    return NextResponse.json(
      { ok: false, error: "Could not process this image file." },
      { status: 422 },
    );
  }

  const asset = await db.mediaAsset.create({
    data: {
      filename: stored.filename,
      originalName: file.name.slice(0, 200),
      mimeType: stored.mimeType,
      size: stored.size,
      width: stored.width,
      height: stored.height,
      alt,
      url: stored.url,
      uploadedById: user.id,
      uploadedByName: user.name,
    },
  });

  audit({
    userId: user.id,
    action: "media.upload",
    entity: "media",
    entityId: asset.id,
    meta: { filename: asset.filename, size: asset.size },
    ip,
  });

  return NextResponse.json({ ok: true, asset }, { status: 201 });
}
