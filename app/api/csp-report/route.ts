import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Collector for the Report-Only CSP in next.config.ts. Reports are logged,
 * never stored: the point is to see what a strict policy would break
 * before switching it to enforcing, and an unauthenticated endpoint that
 * writes to the database is a free amplification target.
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const { allowed } = rateLimit(`csp:${ip}`, 20, 10 * 60 * 1000);
  if (!allowed) return new NextResponse(null, { status: 429 });

  const raw = await req.text().catch(() => "");
  if (raw.length > 8_000) return new NextResponse(null, { status: 413 });

  try {
    const body = JSON.parse(raw);
    const r = body["csp-report"] ?? body;
    console.warn(
      "[csp] blocked %s on %s (%s)",
      r["violated-directive"] ?? r.effectiveDirective ?? "?",
      r["document-uri"] ?? r.documentURL ?? "?",
      r["blocked-uri"] ?? r.blockedURL ?? "?",
    );
  } catch {
    /* malformed report — ignore rather than log attacker-controlled text */
  }

  // 204: the browser discards the response either way.
  return new NextResponse(null, { status: 204 });
}
