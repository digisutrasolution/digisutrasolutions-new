import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { SLUG_REGEX } from "@/lib/cms/pages";
import { defaultThumbnail, parseVideoUrl } from "@/lib/cms/videos";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

const CreateVideoSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z.string().trim().toLowerCase().min(2).max(120).regex(SLUG_REGEX),
  url: z.string().trim().min(5).max(500),
  description: z.string().trim().max(2000).optional(),
  category: z.string().trim().min(1).max(60).optional(),
  durationSec: z.number().int().positive().max(86400).optional(),
  featured: z.boolean().optional(),
});

export async function GET() {
  const { error } = await requirePermission("pages.view");
  if (error) return error;
  const videos = await db.video.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ ok: true, videos });
}

export async function POST(req: Request) {
  const { user, error } = await requirePermission("videos.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = CreateVideoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const source = parseVideoUrl(parsed.data.url);
  if (!source) {
    return NextResponse.json(
      { ok: false, error: "Paste a YouTube link, Vimeo link, or direct .mp4/.webm URL." },
      { status: 400 },
    );
  }
  const exists = await db.video.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });
  if (exists) {
    return NextResponse.json(
      { ok: false, error: "A video with this slug already exists." },
      { status: 409 },
    );
  }

  const video = await db.video.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      provider: source.provider,
      videoId: source.videoId,
      description: parsed.data.description ?? "",
      category: parsed.data.category ?? "General",
      durationSec: parsed.data.durationSec,
      featured: parsed.data.featured ?? false,
      thumbnailUrl: defaultThumbnail(source.provider, source.videoId),
      uploadedByName: user.name,
    },
  });

  audit({
    userId: user.id,
    action: "video.create",
    entity: "video",
    entityId: video.id,
    meta: { slug: video.slug, provider: video.provider },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, video }, { status: 201 });
}
