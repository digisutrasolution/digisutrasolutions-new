import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { descendantIds, markDirty, parseLocation } from "@/lib/menu-admin";
import { clientIp } from "@/lib/rate-limit";

const BulkSchema = z.object({
  location: z.string(),
  ids: z.array(z.string().min(1)).min(1).max(500),
  action: z.enum(["show", "hide", "trash"]),
});

/** Apply one action to many selected items. Trash takes each selection's
    subtree with it, matching single-item delete. */
export async function POST(req: Request) {
  const { user, error } = await requirePermission("menus.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = BulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const location = parseLocation(parsed.data.location);
  if (!location) {
    return NextResponse.json({ ok: false, error: "Unknown menu location." }, { status: 400 });
  }
  const { ids, action } = parsed.data;

  // Only touch rows that really belong to this location.
  const owned = await db.menuItem.findMany({
    where: { id: { in: ids }, location, deletedAt: null },
    select: { id: true },
  });
  const ownedIds = owned.map((o) => o.id);
  if (ownedIds.length === 0) {
    return NextResponse.json({ ok: false, error: "Nothing to update." }, { status: 400 });
  }

  let affected = 0;
  if (action === "trash") {
    const withKids = new Set(ownedIds);
    for (const id of ownedIds) {
      for (const d of await descendantIds(id)) withKids.add(d);
    }
    const res = await db.menuItem.updateMany({
      where: { id: { in: [...withKids] } },
      data: { deletedAt: new Date() },
    });
    affected = res.count;
  } else {
    const res = await db.menuItem.updateMany({
      where: { id: { in: ownedIds } },
      data: { visible: action === "show" },
    });
    affected = res.count;
  }
  await markDirty(location);

  audit({
    userId: user.id,
    action: `menu.bulk.${action}`,
    entity: "menu",
    entityId: location,
    meta: { requested: ids.length, affected },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, affected });
}
