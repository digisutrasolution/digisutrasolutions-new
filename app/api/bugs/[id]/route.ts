import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { notifyUsers } from "@/lib/notify";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

const UpdateBugSchema = z.object({
  status: z.enum(["OPEN", "RESOLVED", "WONT_FIX"]),
});

export async function PATCH(req: Request, { params }: Params) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!can(user.role, "testing.review") && !can(user.role, "pages.edit")) {
    return NextResponse.json(
      { ok: false, error: "Your role cannot update bug reports." },
      { status: 403 },
    );
  }
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = UpdateBugSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid bug status." },
      { status: 400 },
    );
  }

  const bug = await db.bugReport.findUnique({ where: { id } });
  if (!bug) {
    return NextResponse.json(
      { ok: false, error: "Bug report not found." },
      { status: 404 },
    );
  }

  const resolved = parsed.data.status !== "OPEN";
  const updated = await db.bugReport.update({
    where: { id },
    data: {
      status: parsed.data.status,
      resolvedAt: resolved ? new Date() : null,
      resolvedById: resolved ? user.id : null,
      resolvedByName: resolved ? user.name : null,
    },
  });

  if (resolved && bug.reportedById) {
    void notifyUsers(
      [bug.reportedById],
      {
        type: "bug",
        title: `Bug ${parsed.data.status === "RESOLVED" ? "resolved" : "closed as won't-fix"}: ${bug.title}`,
        link: `/admin/pages/${bug.pageId}`,
      },
      { excludeUserId: user.id },
    );
  }

  audit({
    userId: user.id,
    action: "bug.update",
    entity: "bug",
    entityId: id,
    meta: { status: parsed.data.status },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, bug: updated });
}
