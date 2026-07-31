import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";
import {
  ACCESS_TOKEN_TTL_SEC,
  REFRESH_TOKEN_TTL_SEC,
  verifyAccessToken,
} from "@/lib/auth/tokens";
import { effectivePermissions, sanitizePermissions, type Permission } from "@/lib/auth/rbac";
import { ensureRbacLoaded } from "@/lib/auth/rbac-server";
import type { Role } from "@prisma/client";

export const ACCESS_COOKIE = "ds_access";
export const REFRESH_COOKIE = "ds_refresh";

const isProd = process.env.NODE_ENV === "production";
// Under a subpath deploy the browser only sends the refresh cookie if its
// path matches the real (prefixed) URL of /api/auth.
const REFRESH_PATH = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/auth`;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Effective permissions after admin overrides — the client and server both
      check this so nav visibility and enforcement always agree. */
  permissions: Permission[];
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
    path: REFRESH_PATH,
    maxAge: REFRESH_TOKEN_TTL_SEC,
  });
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  store.set(REFRESH_COOKIE, "", { path: REFRESH_PATH, maxAge: 0 });
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
    const [user] = await Promise.all([
      db.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true, name: true, email: true, role: true, isActive: true,
          customRole: { select: { permissions: true } },
        },
      }),
      // Refresh the override matrix before resolving permissions.
      ensureRbacLoaded(),
    ]);
    if (!user || !user.isActive) return null;
    // Super Admin is always all-powerful; otherwise a custom role's permission
    // set wins over the enum role, falling back to the enum + matrix.
    const permissions =
      user.role === "SUPER_ADMIN"
        ? effectivePermissions("SUPER_ADMIN")
        : user.customRole
          ? sanitizePermissions(user.customRole.permissions)
          : effectivePermissions(user.role);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions,
    };
  },
);
