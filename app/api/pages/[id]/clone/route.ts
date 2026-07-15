import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("pages.create");
  if (error) return error;
  const { id } = await params;

  const source = await db.page.findUnique({ where: { id } });
  if (!source) {
    return NextResponse.json(
      { ok: false, error: "Page not found." },
      { status: 404 },
    );
  }

  // Find a free copy slug: <slug>-copy, <slug>-copy-2, …
  let slug = `${source.slug}-copy`;
  for (let n = 2; await db.page.findUnique({ where: { slug }, select: { id: true } }); n++) {
    slug = `${source.slug}-copy-${n}`;
  }

  const sections = source.sections as Prisma.InputJsonValue;
  const clone = await db.page.create({
    data: {
      title: `${source.title} (copy)`,
      slug,
      status: "DRAFT",
      sections,
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
      ogImage: source.ogImage,
      noIndex: source.noIndex,
      schemaJson: source.schemaJson ?? undefined,
      createdById: user.id,
      updatedById: user.id,
      versions: {
        create: {
          version: 1,
          title: `${source.title} (copy)`,
          sections,
          seoSnapshot: {},
          note: `Cloned from ${source.slug}`,
          createdById: user.id,
          createdByName: user.name,
        },
      },
    },
    select: { id: true, slug: true },
  });

  audit({
    userId: user.id,
    action: "page.clone",
    entity: "page",
    entityId: clone.id,
    meta: { from: source.slug, slug: clone.slug },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, page: clone }, { status: 201 });
}
