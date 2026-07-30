import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

/** One session plus its ordered page journey. */
export async function GET(_req: Request, { params }: Params) {
  const { error } = await requirePermission("analytics.view");
  if (error) return error;
  const { id } = await params;

  const session = await db.session.findUnique({
    where: { id },
    include: {
      views: {
        orderBy: { createdAt: "asc" },
        select: { id: true, path: true, createdAt: true },
      },
    },
  });
  if (!session) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, session });
}

/** Delete a session and its pageviews (cascade). */
export async function DELETE(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("analytics.view");
  if (error) return error;
  const { id } = await params;

  const deleted = await db.session.delete({ where: { id } }).catch(() => null);
  if (!deleted) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  audit({
    userId: user.id,
    action: "session.delete",
    entity: "session",
    entityId: id,
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
