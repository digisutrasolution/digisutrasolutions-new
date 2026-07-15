import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { SLUG_REGEX } from "@/lib/cms/pages";
import { FormFieldsSchema } from "@/lib/cms/forms";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

const CreateFormSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().min(2).max(80).regex(SLUG_REGEX),
  fields: FormFieldsSchema,
  notifyEmail: z.string().trim().email().nullable().optional(),
});

export async function GET() {
  const { error } = await requirePermission("forms.manage");
  if (error) return error;
  const forms = await db.form.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { submissions: true } } },
  });
  return NextResponse.json({ ok: true, forms });
}

export async function POST(req: Request) {
  const { user, error } = await requirePermission("forms.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = CreateFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const exists = await db.form.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });
  if (exists) {
    return NextResponse.json(
      { ok: false, error: "A form with this slug already exists." },
      { status: 409 },
    );
  }

  const form = await db.form.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      fields: parsed.data.fields as unknown as Prisma.InputJsonValue,
      notifyEmail: parsed.data.notifyEmail ?? null,
    },
  });

  audit({
    userId: user.id,
    action: "form.create",
    entity: "form",
    entityId: form.id,
    meta: { slug: form.slug },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, form }, { status: 201 });
}
