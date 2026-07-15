import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";
import {
  ACCESS_TOKEN_TTL_SEC,
  REFRESH_TOKEN_TTL_SEC,
  verifyAccessToken,
} from "@/lib/auth/tokens";
import type { Role } from "@prisma/client";

export const ACCESS_COOKIE = "ds_access";
export const REFRESH_COOKIE = "ds_refresh";

const isProd = process.env.NODE_ENV === "production";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export async function setSessionCookies(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_TTL_SEC,
  });
  store.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_TTL_SEC,
  });
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  store.set(REFRESH_COOKIE, "", { path: "/api/auth", maxAge: 0 });
}

/**
 * Resolve the current authenticated user from the access-token cookie.
 * Re-validates against the database so deactivated users are cut off
 * immediately even with a valid, unexpired JWT.
 */
export const getCurrentUser = cache(
  async (): Promise<SessionUser | null> => {
    const store = await cookies();
    const token = store.get(ACCESS_COOKIE)?.value;
    if (!token) return null;
    const payload = await verifyAccessToken(token);
    if (!payload) return null;
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) return null;
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  },
);
