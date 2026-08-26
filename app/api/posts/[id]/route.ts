import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { SLUG_REGEX } from "@/lib/cms/pages";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import { sanitizeRichText } from "@/lib/rich-text";

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
    /* Listed for the same reason as the cover dimensions: zod strips what it
       does not know, and the byline silently reverting to the team would be a
       maddening bug to chase. */
    authorId: z.string().max(60).nullable().optional(),
    coverUrl: z.string().trim().max(500).nullable().optional(),
    /* Must be listed here or zod strips them and the editor's dimensions
       appear to save and silently vanish — the same omission that lost the
       gateway card text. Bounded because they size a layout box: a bogus
       200000 would reserve a screen-tall gap before the image loads. */
    coverWidth: z.number().int().min(1).max(20000).nullable().optional(),
    coverHeight: z.number().int().min(1).max(20000).nullable().optional(),
    seoTitle: z.string().trim().max(200).nullable().optional(),
    seoDescription: z.string().trim().max(400).nullable().optional(),
    noIndex: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Nothing to update." });

function readingMinutes(text: string): number {
  // Bodies are HTML now, so strip tags before counting — otherwise every
  // <p> and </strong> is counted as a word and reading times drift up.
  const words = text.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
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

  /* Check the author exists before Prisma does. A bad id would otherwise
     surface as a raw foreign-key violation and a 500, which tells the person
     saving the article nothing useful. */
  if (parsed.data.authorId) {
    const author = await db.author.findUnique({
      where: { id: parsed.data.authorId },
      select: { id: true },
    });
    if (!author) {
      return NextResponse.json(
        { ok: false, error: "That author profile no longer exists." },
        { status: 400 },
      );
    }
  }

  /* Editor HTML is sanitised HERE, on the way in, so the column only ever
     holds allow-listed markup and every reader gets it clean for free. The
     editor component is a convenience, not the boundary — anyone can POST to
     this route without going through it. */
  const cleanBody =
    parsed.data.body !== undefined ? sanitizeRichText(parsed.data.body) : undefined;

  const updated = await db.blogPost.update({
    where: { id },
    data: {
      ...parsed.data,
      ...(cleanBody !== undefined
        ? {
            body: cleanBody,
            // Word count off the TEXT, not the markup — counting tags as words
            // would inflate every reading time the moment bodies became HTML.
            readingMinutes: readingMinutes(cleanBody),
          }
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
  // Its own permission (not blog.manage) so deletion can be granted per role
  // from the admin matrix — it is irreversible, unlike archiving.
  const { user, error } = await requirePermission("blog.delete");
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
