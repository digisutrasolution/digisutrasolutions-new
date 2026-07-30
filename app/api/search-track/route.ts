import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const Schema = z.object({
  q: z.string().trim().min(1).max(100),
  results: z.number().int().min(0).max(10000).optional(),
});

/** Logs an on-site search term (from the /search box) for the admin
    "Top searches" report. No visitor identifier is stored. */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`search:${ip}`, 30, 60 * 1000);
  if (!limited.allowed) return NextResponse.json({ ok: true });

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: true });

  const query = parsed.data.q.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 100);
  if (query.length < 2) return NextResponse.json({ ok: true });

  await db.searchQuery
    .create({ data: { query, results: parsed.data.results ?? 0 } })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
