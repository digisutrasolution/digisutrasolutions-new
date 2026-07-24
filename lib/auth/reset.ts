import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";

/**
 * Password-reset tickets.
 *
 * Only the SHA-256 of the token is stored, so a database leak yields nothing
 * replayable — the same reasoning as RefreshToken. SHA-256 rather than bcrypt
 * is deliberate here: the token is 32 random bytes, so there is no low-entropy
 * secret to slow-hash, and lookup has to be an indexed exact match.
 */

export const RESET_TTL_MIN = 30;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Issues a ticket and invalidates any earlier unused ones for that user, so
    only the newest link in someone's inbox works. */
export async function createResetToken(
  userId: string,
  ip: string | null,
): Promise<string> {
  const token = randomBytes(32).toString("base64url");

  await db.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  await db.passwordResetToken.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + RESET_TTL_MIN * 60_000),
      ip,
    },
  });

  return token;
}

export type ResetCheck =
  | { ok: true; userId: string; tokenId: string }
  | { ok: false; reason: "invalid" | "expired" | "used" | "inactive" };

/** Validates without consuming — used by the reset page so it can show a
    useful message before the visitor types a new password. */
export async function checkResetToken(token: string): Promise<ResetCheck> {
  if (!token) return { ok: false, reason: "invalid" };

  const row = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, isActive: true } } },
  });

  if (!row) return { ok: false, reason: "invalid" };
  if (row.usedAt) return { ok: false, reason: "used" };
  if (row.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (!row.user.isActive) return { ok: false, reason: "inactive" };

  return { ok: true, userId: row.user.id, tokenId: row.id };
}

/**
 * Marks the ticket used, but only if it still is — the WHERE clause carries
 * `usedAt: null`, so two requests racing the same link cannot both win and
 * the second sees a zero count.
 */
export async function consumeResetToken(tokenId: string): Promise<boolean> {
  const res = await db.passwordResetToken.updateMany({
    where: { id: tokenId, usedAt: null },
    data: { usedAt: new Date() },
  });
  return res.count === 1;
}

/** Housekeeping so the table cannot grow without bound. */
export async function purgeExpiredResetTokens(): Promise<void> {
  await db.passwordResetToken
    .deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 86_400_000) } } })
    .catch(() => undefined);
}
