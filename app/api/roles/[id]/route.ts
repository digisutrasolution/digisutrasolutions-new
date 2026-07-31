import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { RoleSchema } from "../route";
import { sanitizePermissions } from "@/lib/auth/rbac";

type Params = { params: Promise<{ id: string }> };
const PatchSchema = RoleSchema.partial();

export async function PATCH(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("roles.manage");
  if (error) return error;
  const { id } = await params;
  const existing = await db.customRole.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const d = parsed.data;
  if (d.name && d.name !== existing.name) {
    const clash = await db.customRole.findUnique({ where: { name: d.name } });
    if (clash) return NextResponse.json({ ok: false, error: "A role with that name already exists." }, { status: 400 });
  }

  const role = await db.customRole.update({
    where: { id },
    data: {
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.permissions !== undefined ? { permissions: sanitizePermissions(d.permissions) } : {}),
    },
  });
  audit({ userId: user.id, action: "role.update", entity: "custom-role", entityId: id, meta: { name: role.name }, ip: clientIp(req) });
  return NextResponse.json({ ok: true, role });
}

/** Delete a custom role. Users holding it fall back to their enum role
    (customRoleId is set null by the FK). */
export async function DELETE(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("roles.manage");
  if (error) return error;
  const { id } = await params;
  const existing = await db.customRole.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  await db.customRole.delete({ where: { id } });
  audit({ userId: user.id, action: "role.delete", entity: "custom-role", entityId: id, meta: { name: existing.name }, ip: clientIp(req) });
  return NextResponse.json({ ok: true });
}
