import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { parseLocation, publishMenu } from "@/lib/menu-admin";
import { clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { user, error } = await requirePermission("menus.manage");
  if (error) return error;

  const body = (await req.json().catch(() => null)) as { location?: string } | null;
  const location = parseLocation(body?.location ?? null);
  if (!location) {
    return NextResponse.json({ ok: false, error: "Unknown menu location." }, { status: 400 });
  }
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
