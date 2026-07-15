import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

const UpdateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    role: z
      .enum(["SUPER_ADMIN", "DEVELOPER", "TESTER", "SEO_MANAGER"])
      .optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(10).max(200).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Nothing to update." });

type Params = { params: Promise<{ id: string }> };

async function superAdminCount(): Promise<number> {
  return db.user.count({ where: { role: "SUPER_ADMIN", isActive: true } });
}

export async function PATCH(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("users.manage");
  if (error) return error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = UpdateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const target = await db.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json(
      { ok: false, error: "User not found." },
      { status: 404 },
    );
  }

  // Never allow the platform to lose its last active Super Admin.
  const demotesLastAdmin =
    target.role === "SUPER_ADMIN" &&
    target.isActive &&
    (parsed.data.role !== undefined && parsed.data.role !== "SUPER_ADMIN" ||
      parsed.data.isActive === false) &&
    (await superAdminCount()) <= 1;
  if (demotesLastAdmin) {
    return NextResponse.json(
      { ok: false, error: "Cannot demote or deactivate the last Super Admin." },
      { status: 409 },
    );
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.role !== undefined) data.role = parsed.data.role;
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
  if (parsed.data.password !== undefined) {
    data.passwordHash = await hashPassword(parsed.data.password);
  }

  const updated = await db.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  // Deactivation or password change kills existing sessions.
  if (parsed.data.isActive === false || parsed.data.password !== undefined) {
    await db.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  audit({
    userId: user.id,
    action: "user.update",
    entity: "user",
    entityId: id,
    meta: {
      changed: Object.keys(parsed.data).filter((k) => k !== "password"),
      passwordChanged: parsed.data.password !== undefined,
    },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, user: updated });
}

export async function DELETE(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("users.manage");
  if (error) return error;
  const { id } = await params;

  if (id === user.id) {
    return NextResponse.json(
      { ok: false, error: "You cannot delete your own account." },
      { status: 409 },
    );
  }

  const target = await db.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json(
      { ok: false, error: "User not found." },
      { status: 404 },
    );
  }
  if (
    target.role === "SUPER_ADMIN" &&
    target.isActive &&
    (await db.user.count({
      where: { role: "SUPER_ADMIN", isActive: true },
    })) <= 1
  ) {
    return NextResponse.json(
      { ok: false, error: "Cannot delete the last Super Admin." },
      { status: 409 },
    );
  }

  await db.user.delete({ where: { id } });
  audit({
    userId: user.id,
    action: "user.delete",
    entity: "user",
    entityId: id,
    meta: { email: target.email },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
