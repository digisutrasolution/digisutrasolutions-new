import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import { checkResetToken, consumeResetToken } from "@/lib/auth/reset";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const ResetSchema = z.object({
  token: z.string().min(10, "Reset link is invalid."),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters.")
    .max(200, "Password is too long."),
});

const REASONS: Record<string, string> = {
  invalid: "This reset link is not valid. Request a new one.",
  expired: "This reset link has expired. Request a new one.",
  used: "This reset link has already been used. Request a new one.",
  inactive: "This account is deactivated. Ask an administrator.",
};

export async function POST(req: Request) {
  const ip = clientIp(req);

  // Guessing a 32-byte token is infeasible, but a limit keeps the endpoint
  // from being usable as a workhorse in any case.
  const limited = rateLimit(`reset-ip:${ip}`, 15, 15 * 60_000);
  if (!limited.allowed) {
    return NextResponse.json(
      { ok: false, error: `Too many attempts — try again in ${limited.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const parsed = ResetSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const check = await checkResetToken(parsed.data.token);
  if (!check.ok) {
    return NextResponse.json(
      { ok: false, error: REASONS[check.reason] ?? REASONS.invalid },
      { status: 400 },
    );
  }

  /* Consume FIRST. If two requests race the same link, updateMany's
     `usedAt: null` guard means only one gets count 1 — so a link can never
     set two different passwords. */
  const consumed = await consumeResetToken(check.tokenId);
  if (!consumed) {
    return NextResponse.json({ ok: false, error: REASONS.used }, { status: 400 });
  }

  await db.user.update({
    where: { id: check.userId },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  });

  /* Whoever requested the reset may be locking out an intruder, so every
     existing session dies with the old password. */
  await db.refreshToken.updateMany({
    where: { userId: check.userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  audit({
    userId: check.userId,
    action: "auth.reset.completed",
    entity: "user",
    entityId: check.userId,
    ip,
  });

  return NextResponse.json({
    ok: true,
    message: "Password updated. You can sign in with it now.",
  });
}
