import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { OfferSchema } from "@/lib/catalog-admin";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission("services.manage");
  if (error) return error;
  const { id } = await params;

  const category = await db.serviceCategory.findUnique({ where: { id } });
  if (!category) {
    return NextResponse.json({ ok: false, error: "Category not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = OfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const last = await db.serviceOffer.findFirst({
    where: { categoryId: id },
    orderBy: { order: "desc" },
  });
  const offer = await db.serviceOffer.create({
    data: {
      categoryId: id,
      name: d.name,
      blurb: d.blurb ?? "",
      highlight: d.highlight ?? false,
      visible: d.visible ?? true,
      order: (last?.order ?? -1) + 1,
    },
  });

  audit({
    userId: user.id,
    action: "service.offer.create",
    entity: "serviceOffer",
    entityId: offer.id,
    meta: { category: category.slug, name: offer.name },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, offer }, { status: 201 });
}
