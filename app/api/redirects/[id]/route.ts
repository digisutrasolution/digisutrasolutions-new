import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

const UpdateSchema = z
  .object({
    isActive: z.boolean().optional(),
    permanent: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Nothing to update." });

export async function PATCH(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("redirects.manage");
  if (error) return error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid input." },
      { status: 400 },
    );
  }

  const redirect = await db.redirect
    .update({ where: { id }, data: parsed.data })
    .catch(() => null);
  if (!redirect) {
    return NextResponse.json(
      { ok: false, error: "Redirect not found." },
      { status: 404 },
    );
  }
  audit({
    userId: user.id,
    action: "redirect.update",
    entity: "redirect",
    entityId: id,
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, redirect });
}

export async function DELETE(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("redirects.manage");
  if (error) return error;
  const { id } = await params;

  const redirect = await db.redirect.findUnique({ where: { id } });
  if (!redirect) {
    return NextResponse.json(
      { ok: false, error: "Redirect not found." },
      { status: 404 },
    );
  }
  await db.redirect.delete({ where: { id } });
  audit({
    userId: user.id,
    action: "redirect.delete",
    entity: "redirect",
    entityId: id,
    meta: { from: redirect.fromPath },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
