import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { notifyRoles } from "@/lib/notify";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

const CommentSchema = z.object({
  body: z.string().trim().min(1, "Comment cannot be empty.").max(2000),
});

export async function POST(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("pages.view");
  if (error) return error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = CommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const page = await db.page.findUnique({
    where: { id },
    select: { id: true, title: true, workflowStage: true },
  });
  if (!page) {
    return NextResponse.json(
      { ok: false, error: "Page not found." },
      { status: 404 },
    );
  }

  const comment = await db.pageComment.create({
    data: {
      pageId: id,
      body: parsed.data.body,
      stageAtTime: page.workflowStage,
      authorId: user.id,
      authorName: user.name,
    },
  });

  void notifyRoles(
    ["SUPER_ADMIN", "DEVELOPER", "TESTER", "SEO_MANAGER"],
    {
      type: "comment",
      title: `${user.name} commented on "${page.title}"`,
      body: parsed.data.body.slice(0, 140),
      link: `/admin/pages/${id}`,
    },
    { excludeUserId: user.id },
  );

  audit({
    userId: user.id,
    action: "page.comment",
    entity: "page",
    entityId: id,
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, comment }, { status: 201 });
}
