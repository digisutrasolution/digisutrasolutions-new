import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

/** Revoke a key (kept for the audit trail, but it stops authenticating). */
export async function DELETE(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("api.manage");
  if (error) return error;
  const { id } = await params;
  const key = await db.apiKey.findUnique({ where: { id } });
  if (!key) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  await db.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
  audit({ userId: user.id, action: "api-key.revoke", entity: "api-key", entityId: id, meta: { name: key.name }, ip: clientIp(req) });
  return NextResponse.json({ ok: true });
}
