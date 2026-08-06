import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { itemsToTree, liveKey, type NavNode } from "@/lib/menu";
import { parseLocation } from "@/lib/menu-admin";
import { diffMenus, summariseDiff } from "@/lib/menu-diff";

/** What publishing this location would actually change on the live site. */
export async function GET(req: Request) {
  const { error } = await requirePermission("menus.manage");
  if (error) return error;

  const location = parseLocation(new URL(req.url).searchParams.get("location"));
  if (!location) {
    return NextResponse.json({ ok: false, error: "Unknown menu location." }, { status: 400 });
  }

  const [liveRow, items] = await Promise.all([
    db.siteSetting.findUnique({ where: { key: liveKey(location) } }),
    db.menuItem.findMany({ where: { location, deletedAt: null } }),
  ]);

  /* The draft tree is built the same way publishMenu will build it, so the
     diff describes exactly what a publish would do — not an approximation. */
  const draft = itemsToTree(items);
  const live = (liveRow?.value as NavNode[] | undefined) ?? [];

  const diff = diffMenus(live, draft);
  return NextResponse.json({
    ok: true,
    diff,
    summary: summariseDiff(diff),
    everPublished: Boolean(liveRow),
  });
}
