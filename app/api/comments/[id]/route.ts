import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

const PatchSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SPAM"]).optional(),
  reply: z.string().trim().max(2000).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission("comments.moderate");
  if (error) return error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const comment = await db.blogComment
    .update({
      where: { id },
      data: {
        ...(d.status !== undefined ? { status: d.status } : {}),
        ...(d.reply !== undefined
          ? {
              reply: d.reply || null,
              repliedAt: d.reply ? new Date() : null,
              // A reply implies the review is public.
              ...(d.reply && d.status === undefined ? { status: "APPROVED" } : {}),
            }
          : {}),
      },
    })
    .catch(() => null);
  if (!comment) {
    return NextResponse.json({ ok: false, error: "Comment not found." }, { status: 404 });
  }

  audit({
    userId: user.id,
    action: "comment.moderate",
    entity: "blogComment",
    entityId: id,
    meta: { status: comment.status, replied: Boolean(comment.reply) },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, comment });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission("comments.moderate");
  if (error) return error;
  const { id } = await params;

  const comment = await db.blogComment.delete({ where: { id } }).catch(() => null);
  if (!comment) {
    return NextResponse.json({ ok: false, error: "Comment not found." }, { status: 404 });
  }

  audit({
    userId: user.id,
    action: "comment.delete",
    entity: "blogComment",
    entityId: id,
    meta: { name: comment.name },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
