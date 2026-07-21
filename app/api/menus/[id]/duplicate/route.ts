import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { MAX_MENU_DEPTH, markDirty } from "@/lib/menu-admin";
import { clientIp } from "@/lib/rate-limit";

/** Deep-copy a menu item (children included), inserted right after it. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission("menus.manage");
  if (error) return error;
  const { id } = await params;

  const item = await db.menuItem.findUnique({ where: { id } });
  if (!item || item.deletedAt) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  // Shift later siblings down one slot, insert the copy right after.
  await db.menuItem.updateMany({
    where: {
      location: item.location,
      parentId: item.parentId,
      deletedAt: null,
      order: { gt: item.order },
    },
    data: { order: { increment: 1 } },
  });

  /* Recursive clone — the whole branch comes along, however deep. The top
     copy starts hidden so publishing it is deliberate. */
  const cloneBranch = async (
    srcId: string,
    parentId: string | null,
    order: number,
    depth: number,
  ): Promise<{ id: string; count: number }> => {
    const src = await db.menuItem.findUniqueOrThrow({ where: { id: srcId } });
    const copy = await db.menuItem.create({
      data: {
        location: src.location,
        parentId,
        label: depth === 0 ? `${src.label} (copy)` : src.label,
        href: src.href,
        icon: src.icon,
        group: src.group,
        badge: src.badge,
        description: src.description,
        visible: depth === 0 ? false : src.visible,
        newTab: src.newTab,
        panelImage: src.panelImage,
        tagline: src.tagline,
        featured: false,
        order,
      },
    });
    let count = 1;
    if (depth < MAX_MENU_DEPTH) {
      const kids = await db.menuItem.findMany({
        where: { parentId: srcId, deletedAt: null },
        orderBy: { order: "asc" },
      });
      for (let i = 0; i < kids.length; i++) {
        count += (await cloneBranch(kids[i].id, copy.id, i, depth + 1)).count;
      }
    }
    return { id: copy.id, count };
  };

  const cloned = await cloneBranch(id, item.parentId, item.order + 1, 0);
  const copy = await db.menuItem.findUniqueOrThrow({ where: { id: cloned.id } });
  await markDirty(item.location);

  audit({
    userId: user.id,
    action: "menu.item.duplicate",
    entity: "menuItem",
    entityId: copy.id,
    meta: { source: id, label: copy.label, itemsCopied: cloned.count },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, item: copy }, { status: 201 });
}
