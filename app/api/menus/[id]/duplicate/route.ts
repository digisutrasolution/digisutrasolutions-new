import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { markDirty } from "@/lib/menu-admin";
import { clientIp } from "@/lib/rate-limit";

/** Deep-copy a menu item (children included), inserted right after it. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission("menus.manage");
  if (error) return error;
  const { id } = await params;

  const item = await db.menuItem.findUnique({
    where: { id },
    include: { children: { orderBy: { order: "asc" } } },
  });
  if (!item) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  // Shift later siblings down one slot, insert the copy right after.
  await db.menuItem.updateMany({
    where: {
      location: item.location,
      parentId: item.parentId,
      order: { gt: item.order },
    },
    data: { order: { increment: 1 } },
  });

  const copy = await db.menuItem.create({
    data: {
      location: item.location,
      parentId: item.parentId,
      label: `${item.label} (copy)`,
      href: item.href,
      icon: item.icon,
      group: item.group,
      badge: item.badge,
      description: item.description,
      visible: false, // copies start hidden so publishing is deliberate
      newTab: item.newTab,
      panelImage: item.panelImage,
      tagline: item.tagline,
      featured: false,
      order: item.order + 1,
    },
  });
  if (item.children.length > 0) {
    await db.menuItem.createMany({
      data: item.children.map((c, i) => ({
        location: c.location,
        parentId: copy.id,
        label: c.label,
        href: c.href,
        icon: c.icon,
        group: c.group,
        badge: c.badge,
        description: c.description,
        visible: c.visible,
        newTab: c.newTab,
        order: i,
      })),
    });
  }
  await markDirty(item.location);

  audit({
    userId: user.id,
    action: "menu.item.duplicate",
    entity: "menuItem",
    entityId: copy.id,
    meta: { source: id, label: copy.label },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, item: copy }, { status: 201 });
}
