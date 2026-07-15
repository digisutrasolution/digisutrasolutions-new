import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  REFRESH_TOKEN_TTL_SEC,
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
} from "@/lib/auth/tokens";
import {
  REFRESH_COOKIE,
  clearSessionCookies,
  setSessionCookies,
} from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`refresh:${ip}`, 30, 10 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests." },
      { status: 429 },
    );
  }

  const store = await cookies();
  const token = store.get(REFRESH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "No session." },
      { status: 401 },
    );
  }

  const record = await db.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(token) },
    include: { user: true },
  });

  if (
    !record ||
    record.revokedAt ||
    record.expiresAt < new Date() ||
    !record.user.isActive
  ) {
    await clearSessionCookies();
    return NextResponse.json(
      { ok: false, error: "Session expired. Sign in again." },
      { status: 401 },
    );
  }

  // Rotate: revoke the presented token, issue a fresh pair.
  const next = generateRefreshToken();
  await db.$transaction([
    db.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    }),
    db.refreshToken.create({
      data: {
        tokenHash: next.hash,
        userId: record.userId,
        userAgent: req.headers.get("user-agent")?.slice(0, 300),
        ip,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SEC * 1000),
      },
    }),
  ]);

  const accessToken = await signAccessToken({
    sub: record.user.id,
    role: record.user.role,
    name: record.user.name,
    email: record.user.email,
  });
  await setSessionCookies(accessToken, next.token);

  return NextResponse.json({ ok: true });
}
