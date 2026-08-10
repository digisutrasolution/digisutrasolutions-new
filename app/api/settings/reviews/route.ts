import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import { REVIEWS_SETTING_KEY, ReviewsConfigSchema } from "@/lib/reviews-config";

/* Review-request settings. Gated on proof.manage rather than settings.manage:
   this is the copy and the Place ID behind the testimonial ask, which belongs
   to whoever curates proof, not to whoever configures the server. */

export async function PUT(req: Request) {
  const { user, error } = await requirePermission("proof.manage");
  if (error) return error;

  const parsed = ReviewsConfigSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const value = parsed.data as object;
  await db.siteSetting.upsert({
    where: { key: REVIEWS_SETTING_KEY },
    create: { key: REVIEWS_SETTING_KEY, value },
    update: { value },
  });

  audit({
    userId: user.id,
    action: "settings.reviews",
    entity: "setting",
    entityId: REVIEWS_SETTING_KEY,
    meta: { placeIdSet: Boolean(parsed.data.placeId) },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
