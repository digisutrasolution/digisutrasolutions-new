/**
 * In-memory sliding-window rate limiter. Sufficient for a single Node
 * process (local dev / single Vercel region burst protection). For
 * multi-instance production hardening, swap the store for Upstash Redis —
 * the call signature stays the same.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    const oldest = recent[0];
    return {
      allowed: false,
      retryAfterSec: Math.ceil((windowMs - (now - oldest)) / 1000),
    };
  }
  recent.push(now);
  buckets.set(key, recent);
  if (buckets.size > 10_000) {
    // Opportunistic cleanup so the map can't grow unbounded.
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"
  );
}
