import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { hashRefreshToken } from "@/lib/auth/tokens";
import { REFRESH_COOKIE, clearSessionCookies } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const store = await cookies();
  const token = store.get(REFRESH_COOKIE)?.value;

  if (token) {
    await db.refreshToken.updateMany({
      where: { tokenHash: hashRefreshToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  await clearSessionCookies();
  if (user) {
    audit({
      userId: user.id,
      action: "auth.logout",
      entity: "user",
      entityId: user.id,
      ip: clientIp(req),
    });
  }
  return NextResponse.json({ ok: true });
}
