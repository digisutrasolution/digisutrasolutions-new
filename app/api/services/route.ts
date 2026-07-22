import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { CategorySchema, bootstrapServicesIfEmpty } from "@/lib/catalog-admin";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

export async function GET() {
  const { error } = await requirePermission("services.manage");
  if (error) return error;
  await bootstrapServicesIfEmpty();
  const categories = await db.serviceCategory.findMany({
    orderBy: { order: "asc" },
    include: { offers: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json({ ok: true, categories });
}

export async function POST(req: Request) {
  const { user, error } = await requirePermission("services.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = CategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const d = parsed.data;
  if (await db.serviceCategory.findUnique({ where: { slug: d.slug } })) {
    return NextResponse.json({ ok: false, error: "Slug already exists." }, { status: 400 });
  }
  const last = await db.serviceCategory.findFirst({ orderBy: { order: "desc" } });
  const category = await db.serviceCategory.create({
    data: {
      slug: d.slug,
      name: d.name,
      blurb: d.blurb ?? "",
      intro: d.intro ?? "",
      icon: d.icon ?? null,
      badge: d.badge ?? null,
      image: d.image ?? null,
      stat: d.stat ?? null,
      statLabel: d.statLabel ?? null,
      priceFrom: d.priceFrom ?? null,
      marketNote: d.marketNote ?? null,
      group: d.group ?? null,
      visible: d.visible ?? true,
      order: (last?.order ?? -1) + 1,
    },
  });

  audit({
    userId: user.id,
    action: "service.category.create",
    entity: "serviceCategory",
    entityId: category.id,
    meta: { slug: category.slug },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, category }, { status: 201 });
}
