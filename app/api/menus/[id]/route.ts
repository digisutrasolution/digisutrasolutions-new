import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { ItemSchema, markDirty } from "@/lib/menu-admin";
import { clientIp } from "@/lib/rate-limit";

const PatchSchema = ItemSchema.partial().extend({
  /* Reorder: index within the target sibling list. Combined with parentId
     (or parentId: null for top level) this also moves across parents. */
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
  const { moveTo, parentId: nextParentId, ...fields } = parsed.data;

  // Optional cross-parent move: only leaf items, target must be a top-level
  // item in the same menu (depth stays at 2), or null for top level.
  let parentChange: { parentId: string | null } | undefined;
  if (nextParentId !== undefined && nextParentId !== item.parentId) {
    const hasChildren = (await db.menuItem.count({ where: { parentId: id } })) > 0;
    if (hasChildren) {
      return NextResponse.json(
        { ok: false, error: "Items with sub-items can't become sub-items themselves." },
        { status: 400 },
      );
    }
    if (nextParentId) {
      const parent = await db.menuItem.findUnique({ where: { id: nextParentId } });
      if (!parent || parent.parentId || parent.location !== item.location || parent.id === id) {
        return NextResponse.json(
          { ok: false, error: "Target parent must be a top-level item in the same menu." },
          { status: 400 },
        );
      }
    }
    parentChange = { parentId: nextParentId };
  }

  const updated = await db.menuItem.update({
    where: { id },
    data: {
      ...(fields.label !== undefined ? { label: fields.label } : {}),
      ...(fields.href !== undefined ? { href: fields.href } : {}),
      ...(fields.icon !== undefined ? { icon: fields.icon } : {}),
      ...(fields.group !== undefined ? { group: fields.group } : {}),
      ...(fields.badge !== undefined ? { badge: fields.badge } : {}),
      ...(fields.description !== undefined ? { description: fields.description } : {}),
      ...(fields.visible !== undefined ? { visible: fields.visible } : {}),
      ...(fields.newTab !== undefined ? { newTab: fields.newTab } : {}),
      ...(fields.panelImage !== undefined ? { panelImage: fields.panelImage } : {}),
      ...(fields.tagline !== undefined ? { tagline: fields.tagline } : {}),
      ...(fields.featured !== undefined ? { featured: fields.featured } : {}),
      ...(parentChange ?? {}),
    },
  });

  if (moveTo !== undefined || parentChange) {
    const siblings = await db.menuItem.findMany({
      where: { location: item.location, parentId: updated.parentId },
      orderBy: { order: "asc" },
    });
    const rest = siblings.filter((s) => s.id !== id);
    const at = moveTo !== undefined ? Math.min(moveTo, rest.length) : rest.length;
    rest.splice(at, 0, updated);
    await db.$transaction(
      rest.map((s, i) => db.menuItem.update({ where: { id: s.id }, data: { order: i } })),
    );
    if (parentChange) {
      // Close the gap left behind in the old sibling list.
      const old = await db.menuItem.findMany({
        where: { location: item.location, parentId: item.parentId, NOT: { id } },
        orderBy: { order: "asc" },
      });
      await db.$transaction(
        old.map((s, i) => db.menuItem.update({ where: { id: s.id }, data: { order: i } })),
      );
    }
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
