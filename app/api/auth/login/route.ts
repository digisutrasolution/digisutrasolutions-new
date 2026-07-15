import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import {
  REFRESH_TOKEN_TTL_SEC,
  generateRefreshToken,
  signAccessToken,
} from "@/lib/auth/tokens";
import { setSessionCookies } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`login:${ip}`, 10, 10 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many login attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid email and password." },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });
  const validPassword = user
    ? await verifyPassword(password, user.passwordHash)
    : false;

  if (!user || !validPassword || !user.isActive) {
    audit({
      action: "auth.login_failed",
      entity: "user",
      entityId: user?.id,
      meta: { email },
      ip,
    });
    return NextResponse.json(
      { ok: false, error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const accessToken = await signAccessToken({
    sub: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });
  const refresh = generateRefreshToken();
  await db.refreshToken.create({
    data: {
      tokenHash: refresh.hash,
      userId: user.id,
      userAgent: req.headers.get("user-agent")?.slice(0, 300),
      ip,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SEC * 1000),
    },
  });
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await setSessionCookies(accessToken, refresh.token);
  audit({ userId: user.id, action: "auth.login", entity: "user", entityId: user.id, ip });

  return NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
