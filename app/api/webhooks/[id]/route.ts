import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { WebhookSchema } from "../route";

type Params = { params: Promise<{ id: string }> };
const PatchSchema = WebhookSchema.partial();

export async function PATCH(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("api.manage");
  if (error) return error;
  const { id } = await params;
  const existing = await db.webhook.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const webhook = await db.webhook.update({ where: { id }, data: parsed.data });
  audit({ userId: user.id, action: "webhook.update", entity: "webhook", entityId: id, meta: { fields: Object.keys(parsed.data) }, ip: clientIp(req) });
  return NextResponse.json({ ok: true, webhook });
}

export async function DELETE(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("api.manage");
  if (error) return error;
  const { id } = await params;
  const existing = await db.webhook.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  await db.webhook.delete({ where: { id } });
  audit({ userId: user.id, action: "webhook.delete", entity: "webhook", entityId: id, meta: { url: existing.url }, ip: clientIp(req) });
  return NextResponse.json({ ok: true });
}
