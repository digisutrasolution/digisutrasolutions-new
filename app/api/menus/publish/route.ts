import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { parseLocation, publishMenu } from "@/lib/menu-admin";
import { clientIp } from "@/lib/rate-limit";
import { checkLocation, selfOrigin } from "@/lib/menu-check";

export async function POST(req: Request) {
  const { user, error } = await requirePermission("menus.manage");
  if (error) return error;

  const body = (await req.json().catch(() => null)) as { location?: string } | null;
  const location = parseLocation(body?.location ?? null);
  if (!location) {
    return NextResponse.json({ ok: false, error: "Unknown menu location." }, { status: 400 });
  }
  /* Publishing a menu changes every page at once, so check the links first
     and hand the count back. This warns rather than blocks: a link can be
     legitimately broken at publish time (the target page is scheduled, or is
     being written), and refusing would strand the editor. */
  let brokenLinks = 0;
  try {
    const results = await checkLocation(location, selfOrigin(req));
    brokenLinks = results.filter((r) => r.status === "broken").length;
  } catch {
    /* health check must never stop a publish */
  }

  const { tree, version } = await publishMenu(location, user.name ?? user.email);
  revalidatePath("/", "layout"); // bust ISR pages (home) so the nav swaps immediately

  audit({
    userId: user.id,
    action: "menu.publish",
    entity: "menu",
    entityId: location,
    meta: { versionId: version.id, topLevelItems: tree.length, brokenLinks },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, versionId: version.id, brokenLinks });
}
