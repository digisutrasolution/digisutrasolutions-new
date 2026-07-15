import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

const CreateUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters.")
    .max(200),
  role: z.enum(["SUPER_ADMIN", "DEVELOPER", "TESTER", "SEO_MANAGER"]),
});

export async function GET() {
  const { user, error } = await requirePermission("users.manage");
  if (error) return error;
  void user;

  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ ok: true, users });
}

export async function POST(req: Request) {
  const { user, error } = await requirePermission("users.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const exists = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (exists) {
    return NextResponse.json(
      { ok: false, error: "A user with this email already exists." },
      { status: 409 },
    );
  }

  const created = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash: await hashPassword(parsed.data.password),
    },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  audit({
    userId: user.id,
    action: "user.create",
    entity: "user",
    entityId: created.id,
    meta: { email: created.email, role: created.role },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, user: created }, { status: 201 });
}
