import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  ItemSchema,
  MAX_MENU_DEPTH,
  descendantIds,
  markDirty,
  menuDepth,
  subtreeHeight,
} from "@/lib/menu-admin";
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

  /* Cross-parent move at any depth. Guards: the target must live in this
     menu, must not be inside the item's own subtree (cycle), and the move
     must not push the subtree past the depth cap. */
  let parentChange: { parentId: string | null } | undefined;
  if (nextParentId !== undefined && (nextParentId ?? null) !== item.parentId) {
    if (nextParentId) {
      const parent = await db.menuItem.findUnique({ where: { id: nextParentId } });
      if (!parent || parent.location !== item.location || parent.deletedAt || parent.id === id) {
        return NextResponse.json(
          { ok: false, error: "Target parent must be an item in the same menu." },
          { status: 400 },
        );
      }
      if ((await descendantIds(id)).includes(nextParentId)) {
        return NextResponse.json(
          { ok: false, error: "An item can't be moved inside its own sub-menu." },
          { status: 400 },
        );
      }
      const [parentDepth, height] = await Promise.all([
        menuDepth(nextParentId),
        subtreeHeight(id),
      ]);
      if (parentDepth + 1 + height >= MAX_MENU_DEPTH) {
        return NextResponse.json(
          { ok: false, error: `Menus can nest up to ${MAX_MENU_DEPTH} levels.` },
          { status: 400 },
        );
      }
    }
    parentChange = { parentId: nextParentId ?? null };
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
      where: { location: item.location, parentId: updated.parentId, deletedAt: null },
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
        where: { location: item.location, parentId: item.parentId, deletedAt: null, NOT: { id } },
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

  /* Soft delete: the item and its whole subtree go to the trash together so
     Restore brings the branch back intact. */
  const ids = [id, ...(await descendantIds(id))];
  const deletedAt = new Date();
  await db.menuItem.updateMany({ where: { id: { in: ids } }, data: { deletedAt } });

  const siblings = await db.menuItem.findMany({
    where: { location: item.location, parentId: item.parentId, deletedAt: null },
    orderBy: { order: "asc" },
  });
  await db.$transaction(
    siblings.map((s, i) => db.menuItem.update({ where: { id: s.id }, data: { order: i } })),
  );
  await markDirty(item.location);

  audit({
    userId: user.id,
    action: "menu.item.trash",
    entity: "menuItem",
    entityId: id,
    meta: { label: item.label, itemsTrashed: ids.length },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, trashed: ids.length });
}
