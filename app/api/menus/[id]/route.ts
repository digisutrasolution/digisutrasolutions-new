import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { ItemSchema, markDirty } from "@/lib/menu-admin";
import { clientIp } from "@/lib/rate-limit";

const PatchSchema = ItemSchema.partial().extend({
  /* Reorder: index within the item's sibling list (same parent). */
  moveTo: z.number().int().min(0).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission("menus.manage");
  if (error) return error;
  const { id } = await params;

  const item = await db.menuItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  // Items can't change parent via PATCH — reorder happens within a level.
  const { moveTo, parentId: ignoredParent, ...fields } = parsed.data;
  void ignoredParent;

  const updated = await db.menuItem.update({
    where: { id },
    data: {
      ...(fields.label !== undefined ? { label: fields.label } : {}),
      ...(fields.href !== undefined ? { href: fields.href } : {}),
      ...(fields.icon !== undefined ? { icon: fields.icon } : {}),
      ...(fields.group !== undefined ? { group: fields.group } : {}),
      ...(fields.badge !== undefined ? { badge: fields.badge } : {}),
      ...(fields.visible !== undefined ? { visible: fields.visible } : {}),
      ...(fields.newTab !== undefined ? { newTab: fields.newTab } : {}),
      ...(fields.panelImage !== undefined ? { panelImage: fields.panelImage } : {}),
      ...(fields.tagline !== undefined ? { tagline: fields.tagline } : {}),
      ...(fields.featured !== undefined ? { featured: fields.featured } : {}),
    },
  });

  if (moveTo !== undefined) {
    const siblings = await db.menuItem.findMany({
      where: { location: item.location, parentId: item.parentId },
      orderBy: { order: "asc" },
    });
    const rest = siblings.filter((s) => s.id !== id);
    rest.splice(Math.min(moveTo, rest.length), 0, updated);
    await db.$transaction(
      rest.map((s, i) => db.menuItem.update({ where: { id: s.id }, data: { order: i } })),
    );
  }

  await markDirty(item.location);
  audit({
    userId: user.id,
    action: "menu.item.update",
    entity: "menuItem",
    entityId: id,
    meta: { label: updated.label, ...(moveTo !== undefined ? { moveTo } : {}) },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission("menus.manage");
  if (error) return error;
  const { id } = await params;

  const item = await db.menuItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  await db.menuItem.delete({ where: { id } }); // children cascade
  await markDirty(item.location);

  audit({
    userId: user.id,
    action: "menu.item.delete",
    entity: "menuItem",
    entityId: id,
    meta: { label: item.label },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
