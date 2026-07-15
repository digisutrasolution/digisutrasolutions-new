import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { notifyRoles } from "@/lib/notify";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const STATUSES = ["PENDING", "APPROVED", "REJECTED", "SPAM"] as const;

/** Admin: list comments for the moderation queue. */
export async function GET(req: Request) {
  const { error } = await requirePermission("comments.moderate");
  if (error) return error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const where = STATUSES.includes(status as (typeof STATUSES)[number])
    ? { status: status as (typeof STATUSES)[number] }
    : {};

  const [comments, counts] = await Promise.all([
    db.blogComment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { post: { select: { title: true, slug: true } } },
    }),
    db.blogComment.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  return NextResponse.json({
    ok: true,
    comments,
    counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])),
  });
}

const CommentSchema = z.object({
  postSlug: z.string().trim().min(1).max(200),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(200),
  body: z.string().trim().min(10).max(3000),
  rating: z.number().int().min(1).max(5).optional(),
  hp: z.string().optional(),
  t: z.number().optional(),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const { allowed, retryAfterSec } = rateLimit(`comments:${ip}`, 3, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: `Too many reviews from this connection. Try again in ${retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const raw = await req.json().catch(() => null);
  const parsed = CommentSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Name, email and a review of at least 10 characters are required." },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Honeypot + time-trap (bots submit instantly): pretend success.
  const tooFast = !data.t || Date.now() - data.t < 3000;
  if (data.hp || tooFast) return NextResponse.json({ ok: true, pending: true });

  const post = await db.blogPost.findUnique({
    where: { slug: data.postSlug },
    select: { id: true, title: true, status: true },
  });
  if (!post || post.status !== "PUBLISHED") {
    return NextResponse.json({ ok: false, error: "Post not found." }, { status: 404 });
  }

  const comment = await db.blogComment.create({
    data: {
      postId: post.id,
      name: data.name,
      email: data.email,
      body: data.body,
      rating: data.rating,
      ipHash: createHash("sha256").update(ip).digest("hex").slice(0, 24),
    },
  });

  notifyRoles(["SUPER_ADMIN", "SEO_MANAGER"], {
    type: "comment.submitted",
    title: `New review awaiting approval on "${post.title}"`,
    body: `${data.name}${data.rating ? ` · ${data.rating}★` : ""}: ${data.body.slice(0, 140)}`,
    link: "/admin/comments",
  });

  return NextResponse.json({ ok: true, pending: true, id: comment.id }, { status: 201 });
}
