import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { MENU_LOCATION } from "@/lib/menu";
import { publishMenu } from "@/lib/menu-admin";
import { clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { user, error } = await requirePermission("menus.manage");
  if (error) return error;

  const location = MENU_LOCATION;
  const { tree, version } = await publishMenu(location, user.name ?? user.email);
  revalidatePath("/", "layout"); // bust ISR pages (home) so the nav swaps immediately

  audit({
    userId: user.id,
    action: "menu.publish",
    entity: "menu",
    entityId: location,
    meta: { versionId: version.id, topLevelItems: tree.length },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, versionId: version.id });
}
