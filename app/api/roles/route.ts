import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { sanitizePermissions } from "@/lib/auth/rbac";

export const RoleSchema = z.object({
  name: z.string().trim().min(1).max(60),
  permissions: z.array(z.string()).max(100).default([]),
});

/** List custom roles with how many users hold each. */
export async function GET() {
  const { error } = await requirePermission("roles.manage");
  if (error) return error;
  const roles = await db.customRole.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });
  return NextResponse.json({
    ok: true,
    roles: roles.map((r) => ({ id: r.id, name: r.name, permissions: r.permissions, userCount: r._count.users })),
  });
}

export async function POST(req: Request) {
  const { user, error } = await requirePermission("roles.manage");
  if (error) return error;
  const parsed = RoleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const exists = await db.customRole.findUnique({ where: { name: parsed.data.name } });
  if (exists) return NextResponse.json({ ok: false, error: "A role with that name already exists." }, { status: 400 });

  const role = await db.customRole.create({
    data: { name: parsed.data.name, permissions: sanitizePermissions(parsed.data.permissions) },
  });
  audit({ userId: user.id, action: "role.create", entity: "custom-role", entityId: role.id, meta: { name: role.name }, ip: clientIp(req) });
  return NextResponse.json({ ok: true, id: role.id }, { status: 201 });
}
