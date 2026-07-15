import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { SLUG_REGEX } from "@/lib/cms/pages";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

const UpdatePostSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2)
      .max(150)
      .regex(SLUG_REGEX)
      .optional(),
    excerpt: z.string().trim().max(500).optional(),
    body: z.string().max(100000).optional(),
    category: z.string().trim().min(1).max(60).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(15).optional(),
    coverUrl: z.string().trim().max(500).nullable().optional(),
    seoTitle: z.string().trim().max(200).nullable().optional(),
    seoDescription: z.string().trim().max(400).nullable().optional(),
    noIndex: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Nothing to update." });

function readingMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export async function GET(_req: Request, { params }: Params) {
  const { error } = await requirePermission("blog.manage");
  if (error) return error;
  const { id } = await params;
  const post = await db.blogPost.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json(
      { ok: false, error: "Post not found." },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true, post });
}

export async function PATCH(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("blog.manage");
  if (error) return error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = UpdatePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const post = await db.blogPost.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json(
      { ok: false, error: "Post not found." },
      { status: 404 },
    );
  }
  if (parsed.data.slug && parsed.data.slug !== post.slug) {
    const exists = await db.blogPost.findUnique({
      where: { slug: parsed.data.slug },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json(
        { ok: false, error: "A post with this slug already exists." },
        { status: 409 },
      );
    }
  }

  const updated = await db.blogPost.update({
    where: { id },
    data: {
      ...parsed.data,
      ...(parsed.data.body !== undefined
        ? { readingMinutes: readingMinutes(parsed.data.body) }
        : {}),
    },
  });

  audit({
    userId: user.id,
    action: "post.update",
    entity: "post",
    entityId: id,
    meta: { fields: Object.keys(parsed.data) },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, post: updated });
}

export async function DELETE(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("blog.manage");
  if (error) return error;
  const { id } = await params;

  const post = await db.blogPost.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json(
      { ok: false, error: "Post not found." },
      { status: 404 },
    );
  }
  if (post.status === "PUBLISHED") {
    return NextResponse.json(
      { ok: false, error: "Unpublish the post before deleting it." },
      { status: 409 },
    );
  }
  await db.blogPost.delete({ where: { id } });
  audit({
    userId: user.id,
    action: "post.delete",
    entity: "post",
    entityId: id,
    meta: { slug: post.slug },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
