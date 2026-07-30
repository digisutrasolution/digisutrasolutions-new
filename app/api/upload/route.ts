import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { saveUpload } from "@/lib/storage";

const MAX_BYTES = 100 * 1024 * 1024; // 100 MB
// mp4/webm only — these are what parseVideoUrl + the <video> player accept.
const ALLOWED = new Set(["video/mp4", "video/webm"]);

/** Upload a video file (used by the Videos manager as an alternative to a
    YouTube/Vimeo URL). Stored via the shared media backend and recorded in
    the media library. Images go through /api/media instead. */
export async function POST(req: Request) {
  const { user, error } = await requirePermission("media.upload");
  if (error) return error;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { ok: false, error: "Only MP4 or WebM video files." },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "File too large (max 100 MB). Use YouTube/Vimeo for big videos." },
      { status: 413 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await saveUpload(buffer, file.name, file.type);

  await db.mediaAsset
    .create({
      data: {
        filename: stored.filename,
        originalName: file.name.slice(0, 200),
        mimeType: stored.mimeType,
        size: stored.size,
        width: null,
        height: null,
        alt: "",
        url: stored.url,
        uploadedById: user.id,
        uploadedByName: user.name,
      },
    })
    .catch(() => {});

  audit({
    userId: user.id,
    action: "media.upload",
    entity: "media",
    entityId: stored.filename,
    meta: { video: true, size: stored.size },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, url: stored.url }, { status: 201 });
}
