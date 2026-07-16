import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { bootstrapIfEmpty, markDirty, parseLocation } from "@/lib/menu-admin";
import { clientIp } from "@/lib/rate-limit";

/** Replace a location's DRAFT with the built-in defaults. The live menu is
    untouched until the admin publishes the fresh draft. */
export async function POST(req: Request) {
  const { user, error } = await requirePermission("menus.manage");
  if (error) return error;

  const body = (await req.json().catch(() => null)) as { location?: string } | null;
  const location = parseLocation(body?.location ?? null);
  if (!location) {
    return NextResponse.json({ ok: false, error: "Unknown menu location." }, { status: 400 });
  }

  await db.menuItem.deleteMany({ where: { location } });
  await bootstrapIfEmpty(location);
  await markDirty(location);

  audit({
    userId: user.id,
    action: "menu.reset",
    entity: "menu",
    entityId: location,
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
