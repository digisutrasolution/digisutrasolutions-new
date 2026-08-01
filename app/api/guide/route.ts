import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { clientIp } from "@/lib/rate-limit";
import { getGuide, saveGuide } from "@/lib/guide-server";

/** Any logged-in admin can read the guide; editing needs settings.manage. */
export async function GET() {
  const { error } = await requirePermission("leads.manage");
  if (error) return error;
  return NextResponse.json({ ok: true, guide: await getGuide(true) });
}

export async function PUT(req: Request) {
  const { user, error } = await requirePermission("settings.manage");
  if (error) return error;
  const body = await req.json().catch(() => null);
  const guide = await saveGuide(body?.guide ?? body);
  audit({ userId: user.id, action: "guide.update", entity: "settings", entityId: "guide", ip: clientIp(req) });
  return NextResponse.json({ ok: true, guide });
}
