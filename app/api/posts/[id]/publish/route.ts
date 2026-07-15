import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

const ActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("publish") }),
  z.object({ action: z.literal("unpublish") }),
  z.object({ action: z.literal("archive") }),
  z.object({ action: z.literal("restore") }),
  z.object({
    action: z.literal("schedule"),
    scheduledAt: z.coerce.date().refine((d) => d > new Date(), {
      message: "Schedule time must be in the future.",
    }),
  }),
]);

export async function POST(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("blog.publish");
  if (error) return error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid action." },
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

  const input = parsed.data;
  const data =
    input.action === "publish"
      ? { status: "PUBLISHED" as const, publishedAt: new Date(), scheduledAt: null }
      : input.action === "unpublish"
        ? { status: "DRAFT" as const, scheduledAt: null }
        : input.action === "archive"
          ? { status: "ARCHIVED" as const, scheduledAt: null }
          : input.action === "restore"
            ? { status: "DRAFT" as const }
            : {
                status: "SCHEDULED" as const,
                scheduledAt: input.action === "schedule" ? input.scheduledAt : null,
              };

  const updated = await db.blogPost.update({ where: { id }, data });

  audit({
    userId: user.id,
    action: `post.${input.action}`,
    entity: "post",
    entityId: id,
    meta: { slug: post.slug },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, post: updated });
}
