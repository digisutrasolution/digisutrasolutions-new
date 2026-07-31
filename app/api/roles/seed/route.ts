import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { sanitizePermissions, type Permission } from "@/lib/auth/rbac";

/** Ready-made custom roles. Idempotent by name. */
const STARTER_ROLES: { name: string; permissions: Permission[] }[] = [
  {
    // A scoped sales executive: works their own leads end-to-end.
    name: "Sales Member",
    permissions: ["leads.manage", "quotes.manage", "ai.use"],
  },
];

export async function POST(req: Request) {
  const { user, error } = await requirePermission("roles.manage");
  if (error) return error;

  const existing = await db.customRole.findMany({ select: { name: true } });
  const have = new Set(existing.map((r) => r.name));
  const toCreate = STARTER_ROLES.filter((r) => !have.has(r.name));
  for (const r of toCreate) {
    await db.customRole.create({ data: { name: r.name, permissions: sanitizePermissions(r.permissions) } });
  }
  audit({ userId: user.id, action: "role.seed", entity: "custom-role", entityId: `${toCreate.length} created`, ip: clientIp(req) });
  return NextResponse.json({ ok: true, created: toCreate.length });
}
