import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { PAGE_SLUG_REGEX, bustPage, isReservedSlug } from "@/lib/cms/pages";
import { requirePermission } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

/* Optional overrides. With none, this is the plain "duplicate" it always was.
   With them it is also "save as template" and "new from template" — the same
   copy operation, which is why templates need no model of their own. */
const CloneSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(160)
    .regex(PAGE_SLUG_REGEX, "Slug segments may contain lowercase letters, numbers and hyphens, separated by /.")
    .optional(),
  kind: z.enum(["PAGE", "LANDING", "TEMPLATE"]).optional(),
});

export async function POST(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("pages.create");
  if (error) return error;
  const { id } = await params;

  const parsed = CloneSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const source = await db.page.findUnique({ where: { id } });
  if (!source) {
    return NextResponse.json(
      { ok: false, error: "Page not found." },
      { status: 404 },
    );
  }

  /* Instantiating a template produces a landing page, not another template —
     otherwise "new from template" would quietly breed templates. */
  const kind =
    parsed.data.kind ?? (source.kind === "TEMPLATE" ? "LANDING" : source.kind);
  const title = parsed.data.title?.trim() || `${source.title} (copy)`;

  let slug = parsed.data.slug ?? `${source.slug}-copy`;
  if (parsed.data.slug) {
    if (isReservedSlug(slug)) {
      return NextResponse.json(
        { ok: false, error: "That slug is reserved by the system." },
        { status: 409 },
      );
    }
    if (await db.page.findUnique({ where: { slug }, select: { id: true } })) {
      return NextResponse.json(
        { ok: false, error: "A page with this slug already exists." },
        { status: 409 },
      );
    }
  } else {
    // Auto slug: <slug>-copy, <slug>-copy-2, …
    for (let n = 2; await db.page.findUnique({ where: { slug }, select: { id: true } }); n++) {
      slug = `${source.slug}-copy-${n}`;
    }
  }

  const sections = source.sections as Prisma.InputJsonValue;
  const clone = await db.page.create({
    data: {
      title,
      slug,
      kind,
      status: "DRAFT",
      sections,
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
      ogImage: source.ogImage,
      // A landing page made from a template has not been reviewed yet.
      noIndex: source.noIndex || (kind === "LANDING" && source.kind === "TEMPLATE"),
      schemaJson: source.schemaJson ?? undefined,
      createdById: user.id,
      updatedById: user.id,
      versions: {
        create: {
          version: 1,
          title,
          sections,
          seoSnapshot: {},
          note: `Cloned from ${source.slug}`,
          createdById: user.id,
          createdByName: user.name,
        },
      },
    },
    select: { id: true, slug: true, kind: true },
  });

  bustPage(clone.slug);

  audit({
    userId: user.id,
    action: "page.clone",
    entity: "page",
    entityId: clone.id,
    meta: { from: source.slug, slug: clone.slug, kind },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, page: clone }, { status: 201 });
}
