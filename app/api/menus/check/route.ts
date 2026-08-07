import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { MAX_LINKS, checkAllLocations, checkLocation, selfOrigin } from "@/lib/menu-check";

/* On-demand link check for one location. The probing engine itself lives in
   lib/menu-check.ts so the scheduled sweep (/api/cron/menu-check) and this
   button behave identically. */

export async function POST(req: Request) {
  const { error } = await requirePermission("menus.manage");
  if (error) return error;

  const ip = clientIp(req);
  const { allowed, retryAfterSec } = rateLimit(`menucheck:${ip}`, 10, 5 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: `Too many checks. Try again in ${retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const location = typeof body?.location === "string" ? body.location : "HEADER";
  const origin = selfOrigin(req);

  /* Checking one location refreshes the stored health for every location, so
     the sidebar badge can never disagree with what the page just showed. */
  const results = await checkLocation(location, origin);
  void checkAllLocations(origin).catch(() => {});

  const summary = {
    checked: results.length,
    ok: results.filter((r) => r.status === "ok").length,
    broken: results.filter((r) => r.status === "broken").length,
    redirect: results.filter((r) => r.status === "redirect").length,
    external: results.filter((r) => r.status === "external").length,
    anchor: results.filter((r) => r.status === "anchor").length,
    truncated: results.length >= MAX_LINKS,
  };

  return NextResponse.json({ ok: true, summary, results });
}
