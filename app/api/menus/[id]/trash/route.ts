import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { descendantIds, markDirty } from "@/lib/menu-admin";
import { clientIp } from "@/lib/rate-limit";

/** Restore a trashed item and everything under it. If its old parent is
    still in the trash the item comes back at the top level rather than
    reappearing invisibly under a deleted branch. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission("menus.manage");
  if (error) return error;
  const { id } = await params;

  const item = await db.menuItem.findUnique({ where: { id } });
  if (!item || !item.deletedAt) {
    return NextResponse.json({ ok: false, error: "Not in the trash." }, { status: 404 });
  }

  const ids = [id, ...(await descendantIds(id))];
  await db.menuItem.updateMany({ where: { id: { in: ids } }, data: { deletedAt: null } });

  let reparented = false;
  if (item.parentId) {
    const parent = await db.menuItem.findUnique({ where: { id: item.parentId } });
    if (!parent || parent.deletedAt) {
      const last = await db.menuItem.findFirst({
        where: { location: item.location, parentId: null, deletedAt: null },
        orderBy: { order: "desc" },
      });
      await db.menuItem.update({
        where: { id },
        data: { parentId: null, order: (last?.order ?? -1) + 1 },
      });
      reparented = true;
    }
  }
  await markDirty(item.location);

  audit({
    userId: user.id,
    action: "menu.item.restore",
    entity: "menuItem",
    entityId: id,
    meta: { label: item.label, itemsRestored: ids.length, movedToTopLevel: reparented },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, restored: ids.length, reparented });
}

/** Permanently delete a trashed item and its subtree. */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission("menus.manage");
  if (error) return error;
  const { id } = await params;

  const item = await db.menuItem.findUnique({ where: { id } });
  if (!item || !item.deletedAt) {
    return NextResponse.json({ ok: false, error: "Not in the trash." }, { status: 404 });
  }

  await db.menuItem.delete({ where: { id } }); // descendants cascade

  audit({
    userId: user.id,
    action: "menu.item.purge",
    entity: "menuItem",
    entityId: id,
    meta: { label: item.label },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
