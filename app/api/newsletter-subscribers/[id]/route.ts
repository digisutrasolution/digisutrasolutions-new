import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requirePermission("newsletter.manage");
  if (error) return error;
  const { id } = await params;

  const sub = await db.newsletterSubscriber.delete({ where: { id } }).catch(() => null);
  if (!sub) {
    return NextResponse.json({ ok: false, error: "Subscriber not found." }, { status: 404 });
  }

  audit({
    userId: user.id,
    action: "newsletter.unsubscribe",
    entity: "newsletterSubscriber",
    entityId: id,
    meta: { email: sub.email },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
