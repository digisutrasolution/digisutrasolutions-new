import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { SLUG_REGEX } from "@/lib/cms/pages";
import { BLOG_CATEGORIES } from "@/lib/blog";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

const CreatePostSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(150)
    .regex(SLUG_REGEX, "Slug may contain lowercase letters, numbers and hyphens."),
  /* Required, and checked against the real hubs.

     Creation used to set no category at all, so the row fell back to the
     schema default of "General" — a value no hub matches. Every new article
     was therefore born missing from every topic page, and stayed that way
     until somebody opened it and read the warning. Asking once, here, is what
     stops that happening rather than reporting it afterwards. */
  category: z
    .string()
    .trim()
    /* Defaulted to "" so an omitted field falls through to the refine below
       and gets the readable message, rather than zod's "expected string,
       received undefined" — which tells the person creating the article
       nothing about what to do. */
    .default("")
    .refine((v) => BLOG_CATEGORIES.some((c) => c.db === v), {
      message: "Pick a topic hub for the article — without one it would be missing from every topic page.",
    }),
});

export async function GET() {
  const { error } = await requirePermission("blog.manage");
  if (error) return error;
  const posts = await db.blogPost.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      authorName: true,
    },
  });
  return NextResponse.json({ ok: true, posts });
}

export async function POST(req: Request) {
  const { user, error } = await requirePermission("blog.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = CreatePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
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

  /* Credit the creator when they have an author profile of their own.

     authorId used to be stamped with `user.id` — a User id in a column that
     was a bare String with no relation. It is now a foreign key to Author, so
     writing a User id there violates the constraint and the create fails
     outright. Resolving the profile first is both correct and the nicer
     behaviour: a writer with a profile is credited automatically, and everyone
     else starts on the organisation byline and picks an author in the editor. */
  const profile = await db.author.findFirst({
    where: { userId: user.id, isActive: true },
    select: { id: true },
  });

  const post = await db.blogPost.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      category: parsed.data.category,
      authorId: profile?.id ?? null,
      // Legacy label, kept because the admin list shows who drafted an article.
      authorName: user.name,
    },
    select: { id: true, slug: true },
  });

  audit({
    userId: user.id,
    action: "post.create",
    entity: "post",
    entityId: post.id,
    meta: { slug: post.slug },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, post }, { status: 201 });
}
