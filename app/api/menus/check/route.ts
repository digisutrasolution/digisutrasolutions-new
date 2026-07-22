import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { withBase } from "@/lib/base-path";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Menu link health.
 *
 * Rather than compare hrefs against a hand-kept list of valid routes —
 * which drifts the moment a page is renamed — every internal link is
 * actually requested. That is the only check that catches all four ways
 * this has broken before: a typo (/tree-tools), a page unpublished after
 * the link was made, a static segment shadowing a catch-all, and a link
 * that only redirects.
 *
 * Self-origin only: hrefs are prefixed with the deployment base path and
 * resolved against this request's own origin, so nothing here can be
 * pointed at a third-party host.
 */

const MAX_LINKS = 120;
const CONCURRENCY = 8;
const TIMEOUT_MS = 6000;

type Result = {
  id: string;
  label: string;
  href: string;
  status: "ok" | "redirect" | "broken" | "external" | "anchor";
  code?: number;
  note?: string;
};

async function probe(origin: string, href: string): Promise<Pick<Result, "status" | "code" | "note">> {
  if (!href || href === "#") return { status: "anchor", note: "No destination set." };
  if (href.startsWith("#")) return { status: "anchor" };
  if (/^https?:\/\//i.test(href)) return { status: "external", note: "Not checked." };
  if (!href.startsWith("/")) {
    return { status: "broken", note: "Links must start with / or http." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${origin}${withBase(href)}`, {
      redirect: "manual",
      signal: controller.signal,
      headers: { "user-agent": "digisutra-menu-check" },
    });
    if (res.status >= 300 && res.status < 400) {
      return {
        status: "redirect",
        code: res.status,
        note: `Redirects to ${res.headers.get("location") ?? "elsewhere"}`,
      };
    }
    if (res.status >= 400) {
      return { status: "broken", code: res.status, note: `Returns ${res.status}.` };
    }
    return { status: "ok", code: res.status };
  } catch {
    return { status: "broken", note: "No response." };
  } finally {
    clearTimeout(timer);
  }
}

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

  const items = await db.menuItem.findMany({
    where: { location, deletedAt: null },
    select: { id: true, label: true, href: true, visible: true },
    orderBy: { order: "asc" },
    take: MAX_LINKS,
  });

  const origin = new URL(req.url).origin;

  /* Identical hrefs are probed once — menus repeat targets constantly. */
  const cache = new Map<string, Pick<Result, "status" | "code" | "note">>();
  const results: Result[] = [];

  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const slice = items.slice(i, i + CONCURRENCY);
    await Promise.all(
      slice.map(async (item) => {
        let outcome = cache.get(item.href);
        if (!outcome) {
          outcome = await probe(origin, item.href);
          cache.set(item.href, outcome);
        }
        results.push({ id: item.id, label: item.label, href: item.href, ...outcome });
      }),
    );
  }

  const summary = {
    checked: results.length,
    ok: results.filter((r) => r.status === "ok").length,
    broken: results.filter((r) => r.status === "broken").length,
    redirect: results.filter((r) => r.status === "redirect").length,
    external: results.filter((r) => r.status === "external").length,
    anchor: results.filter((r) => r.status === "anchor").length,
    truncated: items.length >= MAX_LINKS,
  };

  return NextResponse.json({ ok: true, summary, results });
}
