import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { FormFieldsSchema } from "@/lib/cms/forms";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

const UpdateFormSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    fields: FormFieldsSchema.optional(),
    notifyEmail: z.string().trim().email().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Nothing to update." });

export async function PATCH(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("forms.manage");
  if (error) return error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = UpdateFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const form = await db.form
    .update({
      where: { id },
      data: {
        ...parsed.data,
        ...(parsed.data.fields
          ? { fields: parsed.data.fields as unknown as Prisma.InputJsonValue }
          : {}),
      },
    })
    .catch(() => null);
  if (!form) {
    return NextResponse.json(
      { ok: false, error: "Form not found." },
      { status: 404 },
    );
  }

  audit({
    userId: user.id,
    action: "form.update",
    entity: "form",
    entityId: id,
    meta: { fields: Object.keys(parsed.data) },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, form });
}

export async function DELETE(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("forms.manage");
  if (error) return error;
  const { id } = await params;

  const form = await db.form.findUnique({ where: { id } });
  if (!form) {
    return NextResponse.json(
      { ok: false, error: "Form not found." },
      { status: 404 },
    );
  }
  await db.form.delete({ where: { id } });
  audit({
    userId: user.id,
    action: "form.delete",
    entity: "form",
    entityId: id,
    meta: { slug: form.slug },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
