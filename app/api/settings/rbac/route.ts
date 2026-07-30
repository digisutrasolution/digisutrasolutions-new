import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { clientIp } from "@/lib/rate-limit";
import {
  ALL_PERMISSIONS,
  EDITABLE_ROLES,
  currentMatrix,
  type Permission,
} from "@/lib/auth/rbac";
import { ensureRbacLoaded, saveRbacMatrix } from "@/lib/auth/rbac-server";

const permSet = new Set<string>(ALL_PERMISSIONS);

const Schema = z.object({
  matrix: z.record(z.string(), z.array(z.string())),
});

/** Current effective permission matrix for the editable roles. */
export async function GET() {
  const { error } = await requirePermission("roles.manage");
  if (error) return error;
  await ensureRbacLoaded(true);
  return NextResponse.json({ ok: true, matrix: currentMatrix() });
}

/** Replace the matrix. Super Admin is never included (always all-powerful). */
export async function PUT(req: Request) {
  const { user, error } = await requirePermission("roles.manage");
  if (error) return error;

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });
  }

  // Keep only editable roles and known permissions; drop everything else.
  const clean = {} as Record<(typeof EDITABLE_ROLES)[number], Permission[]>;
  for (const role of EDITABLE_ROLES) {
    const list = parsed.data.matrix[role] ?? [];
    clean[role] = [...new Set(list.filter((p): p is Permission => permSet.has(p)))];
  }

  await saveRbacMatrix(clean);
  audit({
    userId: user.id,
    action: "rbac.update",
    entity: "settings",
    entityId: "rbac",
    meta: { counts: Object.fromEntries(EDITABLE_ROLES.map((r) => [r, clean[r].length])) },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, matrix: clean });
}
