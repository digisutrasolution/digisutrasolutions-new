import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { parseUa } from "@/lib/ua";

const TrackSchema = z.object({
  path: z.string().trim().min(1).max(300).startsWith("/"),
  referrer: z.string().trim().max(500).optional(),
  /** Ephemeral per-tab session key from sessionStorage — not a cookie. */
  sid: z.string().trim().max(64).optional(),
  /** Which Page actually rendered — set for A/B arms, which are served at
      their control url and would otherwise be invisible in the numbers. */
  pageId: z.string().trim().max(40).optional(),
});

/**
 * First-party page-view beacon — no cookies, no persistent identifiers. Views
 * are grouped into a Session by an ephemeral sessionStorage key (cleared when
 * the tab closes). The IP is only ever stored hashed. Admin paths are skipped.
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

  let sessionId: string | null = null;
  const key = parsed.data.sid;
  if (key) {
    const { device, browser, os } = parseUa(req.headers.get("user-agent"));
    const country =
      req.headers.get("cf-ipcountry") ?? req.headers.get("x-vercel-ip-country") ?? null;
    const ipHash = ip
      ? createHash("sha256").update(ip).digest("hex").slice(0, 16)
      : null;
    try {
      const session = await db.session.upsert({
        where: { key },
        create: {
          key,
          landingPath: path,
          exitPath: path,
          referrer,
          device,
          browser,
          os,
          country: country && country !== "XX" ? country : null,
          ipHash,
        },
        update: {
          lastSeenAt: new Date(),
          exitPath: path,
          pageCount: { increment: 1 },
        },
        select: { id: true },
      });
      sessionId = session.id;
    } catch {
      sessionId = null;
    }
  }

  /* Unverified client input, so a bad id must not fail the beacon — the FK
     is nulled rather than letting the whole insert reject. */
  await db.pageView
    .create({ data: { path, referrer, sessionId, pageId: parsed.data.pageId ?? null } })
    .catch(async () => {
      await db.pageView.create({ data: { path, referrer, sessionId } }).catch(() => {});
    });

  return NextResponse.json({ ok: true });
}
