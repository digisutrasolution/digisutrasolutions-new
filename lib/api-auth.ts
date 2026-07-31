import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { API_KEY_PREFIX, type ApiScope } from "@/lib/integrations";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Mint a new key: returns the plaintext (shown once) + what to store. */
export function generateApiKey(): { plaintext: string; prefix: string; keyHash: string } {
  const plaintext = API_KEY_PREFIX + randomBytes(24).toString("hex");
  return { plaintext, prefix: plaintext.slice(0, 12), keyHash: sha256(plaintext) };
}

type AuthedKey = { id: string; scopes: ApiScope[] };

/** Resolve the API key on a request (Authorization: Bearer <key> or
    X-API-Key). Returns null when missing/invalid/revoked. */
export async function authenticateApiKey(req: Request): Promise<AuthedKey | null> {
  const header = req.headers.get("authorization");
  const bearer = header?.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;
  const raw = bearer ?? req.headers.get("x-api-key")?.trim() ?? null;
  if (!raw || !raw.startsWith(API_KEY_PREFIX)) return null;

  const key = await db.apiKey.findUnique({ where: { keyHash: sha256(raw) } });
  if (!key || key.revokedAt) return null;

  // Throttled last-used stamp (best-effort, never blocks the request).
  void db.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  return { id: key.id, scopes: key.scopes as ApiScope[] };
}

/** 401/403 JSON responses in the shape the public API uses. */
export function apiError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
