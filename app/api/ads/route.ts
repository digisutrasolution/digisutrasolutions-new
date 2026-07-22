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

const AdSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(300).optional(),
  imageUrl: urlField.optional().or(z.literal("").transform(() => undefined)),
  targetUrl: urlField,
  placement: z.enum([
    "BLOG_SIDEBAR",
    "ARTICLE_SIDEBAR",
    "ARTICLE_RIGHT",
    "BLOG_INLINE",
    "SERVICE_SIDEBAR",
  ]),
  active: z.boolean().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
});

export async function GET() {
  const { error } = await requirePermission("ads.manage");
  if (error) return error;
  const ads = await db.adBanner.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ ok: true, ads });
}

export async function POST(req: Request) {
  const { user, error } = await requirePermission("ads.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = AdSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const ad = await db.adBanner.create({
    data: {
      title: d.title,
      description: d.description ?? "",
      imageUrl: d.imageUrl,
      targetUrl: d.targetUrl,
      placement: d.placement,
      active: d.active ?? true,
      startsAt: d.startsAt ? new Date(d.startsAt) : null,
      endsAt: d.endsAt ? new Date(d.endsAt) : null,
    },
  });

  audit({
    userId: user.id,
    action: "ad.create",
    entity: "adBanner",
    entityId: ad.id,
    meta: { title: ad.title, placement: ad.placement },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, ad }, { status: 201 });
}
