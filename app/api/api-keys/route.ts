import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { generateApiKey } from "@/lib/api-auth";
import { API_SCOPES } from "@/lib/integrations";

/** List keys — never returns the secret, only the display prefix. */
export async function GET() {
  const { error } = await requirePermission("api.manage");
  if (error) return error;
  const keys = await db.apiKey.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, prefix: true, scopes: true, lastUsedAt: true, revokedAt: true, createdByName: true, createdAt: true },
  });
  return NextResponse.json({ ok: true, keys });
}

const Schema = z.object({
  name: z.string().trim().min(1).max(80),
  scopes: z.array(z.enum(API_SCOPES)).min(1),
});

/** Create a key — the plaintext is returned ONCE and never stored. */
export async function POST(req: Request) {
  const { user, error } = await requirePermission("api.manage");
  if (error) return error;
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const { plaintext, prefix, keyHash } = generateApiKey();
  const key = await db.apiKey.create({
    data: { name: parsed.data.name, prefix, keyHash, scopes: parsed.data.scopes, createdById: user.id, createdByName: user.name },
  });
  audit({ userId: user.id, action: "api-key.create", entity: "api-key", entityId: key.id, meta: { name: key.name }, ip: clientIp(req) });
  return NextResponse.json({ ok: true, id: key.id, plaintext }, { status: 201 });
}
