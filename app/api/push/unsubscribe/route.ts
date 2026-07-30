import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

const UnsubscribeSchema = z.object({ endpoint: z.string().url().max(1000) });

/** Remove this browser's push subscription. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }

  const parsed = UnsubscribeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  await db.pushSubscription
    .deleteMany({ where: { endpoint: parsed.data.endpoint, userId: user.id } })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
