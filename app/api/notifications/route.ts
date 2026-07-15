import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const [items, unread] = await Promise.all([
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);

  return NextResponse.json({ ok: true, items, unread });
}

const MarkReadSchema = z.object({
  ids: z.array(z.string()).max(100).optional(),
});

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const parsed = MarkReadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid input." },
      { status: 400 },
    );
  }

  await db.notification.updateMany({
    where: {
      userId: user.id,
      readAt: null,
      ...(parsed.data.ids ? { id: { in: parsed.data.ids } } : {}),
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
