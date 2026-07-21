import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { dirtyKey } from "@/lib/menu";
import {
  ItemSchema,
  MAX_MENU_DEPTH,
  bootstrapIfEmpty,
  markDirty,
  menuDepth,
  parseLocation,
} from "@/lib/menu-admin";
import { clientIp } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const { error } = await requirePermission("menus.manage");
  if (error) return error;
  const location = parseLocation(new URL(req.url).searchParams.get("location"));
  if (!location) {
    return NextResponse.json({ ok: false, error: "Unknown menu location." }, { status: 400 });
  }

  await bootstrapIfEmpty(location);
  const [items, trash, dirty] = await Promise.all([
    db.menuItem.findMany({
      where: { location, deletedAt: null },
      orderBy: [{ parentId: "asc" }, { order: "asc" }],
    }),
    db.menuItem.findMany({
      where: { location, deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
    }),
    db.siteSetting.findUnique({ where: { key: dirtyKey(location) } }),
  ]);
  return NextResponse.json({ ok: true, items, trash, dirty: dirty?.value === true });
}

export async function POST(req: Request) {
  const { user, error } = await requirePermission("menus.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = ItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const location = parseLocation(
    (body as { location?: string } | null)?.location ?? null,
  );
  if (!location) {
    return NextResponse.json({ ok: false, error: "Unknown menu location." }, { status: 400 });
  }

  // Nesting is unlimited; the parent only has to be a live item in this menu.
  if (d.parentId) {
    const parent = await db.menuItem.findUnique({ where: { id: d.parentId } });
    if (!parent || parent.location !== location || parent.deletedAt) {
      return NextResponse.json(
        { ok: false, error: "Parent must be an item in the same menu." },
        { status: 400 },
      );
    }
    if ((await menuDepth(parent.id)) + 1 >= MAX_MENU_DEPTH) {
      return NextResponse.json(
        { ok: false, error: `Menus can nest up to ${MAX_MENU_DEPTH} levels.` },
        { status: 400 },
      );
    }
  }

  const last = await db.menuItem.findFirst({
    where: { location, parentId: d.parentId ?? null, deletedAt: null },
    orderBy: { order: "desc" },
  });
  const item = await db.menuItem.create({
    data: {
      location,
      parentId: d.parentId ?? null,
      label: d.label,
      href: d.href,
      icon: d.icon ?? null,
      group: d.group ?? null,
      badge: d.badge ?? null,
      description: d.description ?? null,
      visible: d.visible ?? true,
      newTab: d.newTab ?? false,
      panelImage: d.panelImage ?? null,
      tagline: d.tagline ?? null,
      featured: d.featured ?? false,
      order: (last?.order ?? -1) + 1,
    },
  });
  await markDirty(location);

  audit({
    userId: user.id,
    action: "menu.item.create",
    entity: "menuItem",
    entityId: item.id,
    meta: { label: item.label, href: item.href },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, item }, { status: 201 });
}
