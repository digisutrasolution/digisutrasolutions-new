import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

const urlField = z
  .string()
  .trim()
  .min(1)
  .max(600)
  .refine((v) => v.startsWith("/") || v.startsWith("https://") || v.startsWith("http://"), {
    message: "Must be a path (/…) or a full URL.",
  });

const PatchSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(300).optional(),
  imageUrl: urlField.nullable().optional().or(z.literal("").transform(() => null)),
  targetUrl: urlField.optional(),
  placement: z
    .enum([
      "BLOG_SIDEBAR",
      "ARTICLE_SIDEBAR",
      "ARTICLE_RIGHT",
      "BLOG_INLINE",
      "SERVICE_SIDEBAR",
    ])
    .optional(),
  active: z.boolean().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission("ads.manage");
  if (error) return error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const ad = await db.adBanner
    .update({
      where: { id },
      data: {
        ...(d.title !== undefined ? { title: d.title } : {}),
        ...(d.description !== undefined ? { description: d.description } : {}),
        ...(d.imageUrl !== undefined ? { imageUrl: d.imageUrl } : {}),
        ...(d.targetUrl !== undefined ? { targetUrl: d.targetUrl } : {}),
        ...(d.placement !== undefined ? { placement: d.placement } : {}),
        ...(d.active !== undefined ? { active: d.active } : {}),
        ...(d.startsAt !== undefined
          ? { startsAt: d.startsAt ? new Date(d.startsAt) : null }
          : {}),
        ...(d.endsAt !== undefined
          ? { endsAt: d.endsAt ? new Date(d.endsAt) : null }
          : {}),
      },
    })
    .catch(() => null);
  if (!ad) {
    return NextResponse.json({ ok: false, error: "Banner not found." }, { status: 404 });
  }

  audit({
    userId: user.id,
    action: "ad.update",
    entity: "adBanner",
    entityId: ad.id,
    meta: { title: ad.title, active: ad.active },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, ad });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission("ads.manage");
  if (error) return error;
  const { id } = await params;

  const ad = await db.adBanner.delete({ where: { id } }).catch(() => null);
  if (!ad) {
    return NextResponse.json({ ok: false, error: "Banner not found." }, { status: 404 });
  }

  audit({
    userId: user.id,
    action: "ad.delete",
    entity: "adBanner",
    entityId: id,
    meta: { title: ad.title },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
