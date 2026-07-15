import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { RESERVED_SLUGS, SLUG_REGEX } from "@/lib/cms/pages";
import { SectionsSchema } from "@/lib/cms/sections";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

const CreatePageSchema = z.object({
  title: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(120)
    .regex(SLUG_REGEX, "Slug may contain lowercase letters, numbers and hyphens."),
  sections: SectionsSchema.optional(),
});

export async function GET() {
  const { error } = await requirePermission("pages.view");
  if (error) return error;

  const pages = await db.page.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      publishedAt: true,
      scheduledAt: true,
      updatedAt: true,
      updatedBy: { select: { name: true } },
    },
  });
  return NextResponse.json({ ok: true, pages });
}

export async function POST(req: Request) {
  const { user, error } = await requirePermission("pages.create");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = CreatePageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  if (RESERVED_SLUGS.has(parsed.data.slug)) {
    return NextResponse.json(
      { ok: false, error: "That slug is reserved by the system." },
      { status: 409 },
    );
  }
  const exists = await db.page.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });
  if (exists) {
    return NextResponse.json(
      { ok: false, error: "A page with this slug already exists." },
      { status: 409 },
    );
  }

  const sections = (parsed.data.sections ??
    []) as unknown as Prisma.InputJsonValue;
  const page = await db.page.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      sections,
      createdById: user.id,
      updatedById: user.id,
      versions: {
        create: {
          version: 1,
          title: parsed.data.title,
          sections,
          seoSnapshot: {},
          note: "Created",
          createdById: user.id,
          createdByName: user.name,
        },
      },
    },
    select: { id: true, slug: true },
  });

  audit({
    userId: user.id,
    action: "page.create",
    entity: "page",
    entityId: page.id,
    meta: { slug: page.slug },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, page }, { status: 201 });
}
