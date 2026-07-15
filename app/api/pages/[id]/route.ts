import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { RESERVED_SLUGS, SLUG_REGEX } from "@/lib/cms/pages";
import { SectionsSchema } from "@/lib/cms/sections";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

const CONTENT_KEYS = ["title", "slug", "sections"] as const;
const SEO_KEYS = [
  "seoTitle",
  "seoDescription",
  "canonicalUrl",
  "ogImage",
  "noIndex",
  "schemaJson",
] as const;

const UpdatePageSchema = z
  .object({
    title: z.string().trim().min(2).max(160).optional(),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2)
      .max(120)
      .regex(SLUG_REGEX, "Slug may contain lowercase letters, numbers and hyphens.")
      .optional(),
    sections: SectionsSchema.optional(),
    seoTitle: z.string().trim().max(200).nullable().optional(),
    seoDescription: z.string().trim().max(400).nullable().optional(),
    canonicalUrl: z.string().trim().url().max(400).nullable().optional(),
    ogImage: z.string().trim().max(400).nullable().optional(),
    noIndex: z.boolean().optional(),
    schemaJson: z.unknown().nullable().optional(),
    versionNote: z.string().trim().max(300).optional(),
  })
  .refine((v) => Object.keys(v).some((k) => k !== "versionNote"), {
    message: "Nothing to update.",
  });

export async function GET(_req: Request, { params }: Params) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!can(user.role, "pages.view")) {
    return NextResponse.json(
      { ok: false, error: "You don't have permission for this action." },
      { status: 403 },
    );
  }
  const { id } = await params;
  const page = await db.page.findUnique({
    where: { id },
    include: {
      updatedBy: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
  });
  if (!page) {
    return NextResponse.json(
      { ok: false, error: "Page not found." },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true, page });
}

export async function PATCH(req: Request, { params }: Params) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = UpdatePageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const keys = Object.keys(parsed.data);
  const touchesContent = keys.some((k) =>
    (CONTENT_KEYS as readonly string[]).includes(k),
  );
  const touchesSeo = keys.some((k) =>
    (SEO_KEYS as readonly string[]).includes(k),
  );
  if (touchesContent && !can(user.role, "pages.edit")) {
    return NextResponse.json(
      { ok: false, error: "Your role cannot edit page content." },
      { status: 403 },
    );
  }
  if (touchesSeo && !can(user.role, "seo.manage")) {
    return NextResponse.json(
      { ok: false, error: "Your role cannot edit SEO settings." },
      { status: 403 },
    );
  }

  const page = await db.page.findUnique({ where: { id } });
  if (!page) {
    return NextResponse.json(
      { ok: false, error: "Page not found." },
      { status: 404 },
    );
  }

  if (parsed.data.slug && parsed.data.slug !== page.slug) {
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
  }

  const data: Prisma.PageUpdateInput = { updatedBy: { connect: { id: user.id } } };
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.slug !== undefined) data.slug = parsed.data.slug;
  if (parsed.data.sections !== undefined) {
    data.sections = parsed.data.sections as unknown as Prisma.InputJsonValue;
  }
  if (parsed.data.seoTitle !== undefined) data.seoTitle = parsed.data.seoTitle;
  if (parsed.data.seoDescription !== undefined)
    data.seoDescription = parsed.data.seoDescription;
  if (parsed.data.canonicalUrl !== undefined)
    data.canonicalUrl = parsed.data.canonicalUrl;
  if (parsed.data.ogImage !== undefined) data.ogImage = parsed.data.ogImage;
  if (parsed.data.noIndex !== undefined) data.noIndex = parsed.data.noIndex;
  if (parsed.data.schemaJson !== undefined) {
    data.schemaJson =
      parsed.data.schemaJson === null
        ? Prisma.JsonNull
        : (parsed.data.schemaJson as Prisma.InputJsonValue);
  }

  // Content edits invalidate downstream sign-offs: the page returns to
  // the DRAFT stage and must go through testing/review again.
  const resetsStage = touchesContent && page.workflowStage !== "DRAFT";
  if (resetsStage) data.workflowStage = "DRAFT";

  const updated = await db.$transaction(async (tx) => {
    const result = await tx.page.update({ where: { id }, data });
    if (resetsStage) {
      await tx.workflowTransition.create({
        data: {
          pageId: id,
          from: page.workflowStage,
          to: "DRAFT",
          note: "Content edited — returned to draft",
          byId: user.id,
          byName: user.name,
        },
      });
    }
    const last = await tx.pageVersion.findFirst({
      where: { pageId: id },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    await tx.pageVersion.create({
      data: {
        pageId: id,
        version: (last?.version ?? 0) + 1,
        title: result.title,
        sections: result.sections as Prisma.InputJsonValue,
        seoSnapshot: {
          seoTitle: result.seoTitle,
          seoDescription: result.seoDescription,
          canonicalUrl: result.canonicalUrl,
          ogImage: result.ogImage,
          noIndex: result.noIndex,
        },
        note: parsed.data.versionNote ?? (touchesContent ? "Content edit" : "SEO edit"),
        createdById: user.id,
        createdByName: user.name,
      },
    });
    return result;
  });

  audit({
    userId: user.id,
    action: "page.update",
    entity: "page",
    entityId: id,
    meta: { fields: keys, slug: updated.slug },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, page: updated });
}

export async function DELETE(req: Request, { params }: Params) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!can(user.role, "pages.edit")) {
    return NextResponse.json(
      { ok: false, error: "Your role cannot delete pages." },
      { status: 403 },
    );
  }
  const { id } = await params;
  const page = await db.page.findUnique({ where: { id } });
  if (!page) {
    return NextResponse.json(
      { ok: false, error: "Page not found." },
      { status: 404 },
    );
  }
  if (page.status === "PUBLISHED") {
    return NextResponse.json(
      { ok: false, error: "Unpublish or archive the page before deleting it." },
      { status: 409 },
    );
  }
  await db.page.delete({ where: { id } });
  audit({
    userId: user.id,
    action: "page.delete",
    entity: "page",
    entityId: id,
    meta: { slug: page.slug },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
