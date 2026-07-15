import { NextResponse } from "next/server";
import { getCurrentUser, type SessionUser } from "@/lib/auth/session";
import { can, type Permission } from "@/lib/auth/rbac";

type GuardResult =
  | { user: SessionUser; error: null }
  | { user: null; error: NextResponse };

/** Route-handler guard: 401 when unauthenticated. */
export async function requireUser(): Promise<GuardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { ok: false, error: "Authentication required." },
        { status: 401 },
      ),
    };
  }
  return { user, error: null };
}

/** Route-handler guard: 401 unauthenticated, 403 lacking permission. */
export async function requirePermission(
  permission: Permission,
): Promise<GuardResult> {
  const result = await requireUser();
  if (result.error) return result;
  if (!can(result.user.role, permission)) {
    return {
      user: null,
      error: NextResponse.json(
        { ok: false, error: "You don't have permission for this action." },
        { status: 403 },
      ),
    };
  }
  return result;
}
