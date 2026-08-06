import "server-only";
import { withBase } from "@/lib/base-path";
import { db } from "@/lib/db";
import { MENU_LOCATIONS, type MenuLocation } from "@/lib/menu";

/**
 * Menu link health — the shared engine behind the on-demand check button and
 * the scheduled sweep.
 *
 * Rather than compare hrefs against a hand-kept list of valid routes — which
 * drifts the moment a page is renamed — every internal link is actually
 * requested. That is the only check that catches all four ways this has broken
 * before: a typo (/tree-tools), a page unpublished after the link was made, a
 * static segment shadowing a catch-all, and a link that only redirects.
 *
 * Self-origin only: hrefs are prefixed with the deployment base path and
 * resolved against the caller's own origin, so nothing here can be pointed at
 * a third-party host.
 */

export const MAX_LINKS = 120;
const CONCURRENCY = 8;
const TIMEOUT_MS = 6000;

export type LinkStatus = "ok" | "redirect" | "broken" | "external" | "anchor";

export type LinkResult = {
  id: string;
  label: string;
  href: string;
  status: LinkStatus;
  code?: number;
  note?: string;
};

/** Stored health summary (SiteSetting "menu-health"). */
export type MenuHealth = {
  checkedAt: string;
  /** Per location: how many links came back broken, and which ones. */
  byLocation: Record<
    string,
    { broken: number; redirect: number; checked: number; items: LinkResult[] }
  >;
};

export const MENU_HEALTH_KEY = "menu-health";

async function probe(
  origin: string,
  href: string,
): Promise<Pick<LinkResult, "status" | "code" | "note">> {
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

/** Probe every live link in one menu location. */
export async function checkLocation(location: string, origin: string): Promise<LinkResult[]> {
  const items = await db.menuItem.findMany({
    where: { location, deletedAt: null },
    select: { id: true, label: true, href: true },
    orderBy: { order: "asc" },
    take: MAX_LINKS,
  });

  /* Identical hrefs are probed once — menus repeat targets constantly. */
  const cache = new Map<string, Pick<LinkResult, "status" | "code" | "note">>();
  const results: LinkResult[] = [];

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
  return results;
}

/** Sweep every location and persist the summary. Returns the stored health. */
export async function checkAllLocations(origin: string): Promise<MenuHealth> {
  const byLocation: MenuHealth["byLocation"] = {};
  for (const loc of MENU_LOCATIONS) {
    const items = await checkLocation(loc.key, origin);
    byLocation[loc.key] = {
      checked: items.length,
      broken: items.filter((r) => r.status === "broken").length,
      redirect: items.filter((r) => r.status === "redirect").length,
      // Only the problems are stored — a full pass would bloat the row.
      items: items.filter((r) => r.status === "broken" || r.status === "redirect"),
    };
  }
  const health: MenuHealth = { checkedAt: new Date().toISOString(), byLocation };
  await db.siteSetting.upsert({
    where: { key: MENU_HEALTH_KEY },
    create: { key: MENU_HEALTH_KEY, value: health as object },
    update: { value: health as object },
  });
  return health;
}

/** Last stored health, or null when the sweep has never run. */
export async function getMenuHealth(): Promise<MenuHealth | null> {
  try {
    const row = await db.siteSetting.findUnique({ where: { key: MENU_HEALTH_KEY } });
    const v = row?.value as MenuHealth | undefined;
    return v && typeof v.checkedAt === "string" && v.byLocation ? v : null;
  } catch {
    return null;
  }
}

/** Total broken links across every location — the sidebar badge figure. */
export function totalBroken(health: MenuHealth | null): number {
  if (!health) return 0;
  return Object.values(health.byLocation).reduce((n, l) => n + (l.broken ?? 0), 0);
}

/** Broken hrefs keyed for change detection, so a notification only fires when
    something NEWLY breaks rather than on every sweep. */
export function brokenKeys(health: MenuHealth | null): Set<string> {
  const out = new Set<string>();
  if (!health) return out;
  for (const [loc, data] of Object.entries(health.byLocation)) {
    for (const item of data.items) {
      if (item.status === "broken") out.add(`${loc}:${item.href}`);
    }
  }
  return out;
}

export type { MenuLocation };
