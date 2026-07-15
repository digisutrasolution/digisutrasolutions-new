import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const TrackSchema = z.object({
  path: z.string().trim().min(1).max(300).startsWith("/"),
  referrer: z.string().trim().max(500).optional(),
});

/**
 * First-party page-view beacon — no cookies, no user identifiers, just
 * path + referrer host. Admin paths are never recorded.
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`track:${ip}`, 60, 60 * 1000);
  if (!limited.allowed) return NextResponse.json({ ok: true });

  const body = await req.json().catch(() => null);
  const parsed = TrackSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: true });

  const path = parsed.data.path.split("?")[0].slice(0, 300);
  if (path.startsWith("/admin") || path.startsWith("/api")) {
    return NextResponse.json({ ok: true });
  }

  let referrer: string | null = null;
  if (parsed.data.referrer) {
    try {
      const host = new URL(parsed.data.referrer).host;
      referrer = host || null;
    } catch {
      referrer = null;
    }
  }

  await db.pageView
    .create({ data: { path, referrer } })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
