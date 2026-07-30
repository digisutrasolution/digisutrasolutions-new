import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

const SubscribeSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(500),
  }),
});

/** Save (or refresh) the current admin user's browser push subscription. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }

  const parsed = SubscribeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid subscription." }, { status: 400 });
  }

  const { endpoint, keys } = parsed.data;
  const ua = req.headers.get("user-agent")?.slice(0, 300) ?? null;

  // Endpoint is unique — one row per browser. Re-subscribing re-homes it to
  // the current user and refreshes the keys.
  await db.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, ua },
    update: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth, ua },
  });

  return NextResponse.json({ ok: true });
}
