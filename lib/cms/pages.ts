import { cache } from "react";
import { revalidateTag, unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import type { Page, PageStatus } from "@prisma/client";

/* Slug reservation. PREFIXES block any page under that first segment
   (their dynamic routes would shadow the CMS catch-all, so such pages
   could never render). EXACT blocks only the precise slug — nested pages
   beneath these (e.g. "work/clients") are fine because those code routes
   have no dynamic children. */
export const RESERVED_PREFIXES = new Set([
  "admin",
  "api",
  "_next",
  "uploads",
  "blog",
  "services",
]);

export const RESERVED_SLUGS = new Set([
  "work",
  "login",
  "pricing",
  "contact",
  "faq",
  "payment",
  "free-tools/roi-calculator",
  "free-audit",
  "thank-you",
  "search",
  "sitemap.xml",
  "robots.txt",
  "favicon.ico",
  "videos",
]);

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Page slugs may be nested (e.g. "about/why-choose-us"); each segment
    follows SLUG_REGEX. Other content types stay single-segment. */
export const PAGE_SLUG_REGEX =
  /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

export function isReservedSlug(slug: string): boolean {
  return RESERVED_PREFIXES.has(slug.split("/")[0]) || RESERVED_SLUGS.has(slug);
}

/**
 * A SCHEDULED page whose time has arrived is live; flipping the stored
 * status is done lazily here rather than by a cron.
 */
export function isLive(page: Pick<Page, "status" | "scheduledAt" | "kind">): boolean {
  /* A template is scaffolding, never a destination. Gating here rather than at
     the route means the sitemap, the preview gate and anything else that asks
     "is this live?" all inherit it — including a template someone publishes by
     accident. */
  if (page.kind === "TEMPLATE") return false;
  if (page.status === "PUBLISHED") return true;
  return (
    page.status === "SCHEDULED" &&
    page.scheduledAt !== null &&
    page.scheduledAt <= new Date()
  );
}

/** Cache tag for one page, so a publish or an edit busts exactly that page. */
export const pageTag = (slug: string) => `cms-page:${slug}`;

/**
 * Drop a page's cached body immediately.
 *
 * `expire: 0` rather than the recommended `profile: "max"`, on purpose.
 * "max" is stale-while-revalidate: the next visitor is served the OLD page
 * while the new one is fetched behind them. That is right for a product feed
 * and wrong for a CMS — someone clicks Publish, reloads, and has to see their
 * change, not the previous version. `updateTag` would be the idiomatic
 * read-your-own-writes call, but Next restricts it to Server Actions and
 * every mutation here is a Route Handler.
 */
export function bustPage(slug: string): void {
  revalidateTag(pageTag(slug), { expire: 0 });
}

/* How long a page body may be stale if nothing invalidates it. Edits and
   publishes call revalidateTag immediately, so this is only a backstop for
   changes made outside the app (a direct DB edit, a restored backup). */
const PAGE_TTL_SEC = 300;

/* The data cache stores values through a serializer, so a Date can come back
   as an ISO string. isLive() compares scheduledAt with <=, which silently
   misbehaves on a string, so dates are put back explicitly rather than
   trusted. Handles both cases, so it stays correct if Next changes. */
const DATE_FIELDS = ["createdAt", "updatedAt", "publishedAt", "scheduledAt"] as const;

function hydrate(row: unknown): Page | null {
  if (!row || typeof row !== "object") return null;
  const r = { ...(row as Record<string, unknown>) };
  for (const key of DATE_FIELDS) {
    if (typeof r[key] === "string") r[key] = new Date(r[key] as string);
  }
  return r as unknown as Page;
}

/**
 * Look up a page by slug, cached.
 *
 * Every CMS page used to cost a database round trip per visitor. At landing
 * page volume under paid traffic that is the first thing to fall over, and it
 * is pure waste: the row changes when someone edits it, not when someone
 * reads it. `cache()` on top dedupes within a single render (the route asks
 * for the page in generateMetadata, again in the body, and again for the
 * breadcrumb parent).
 */
export const getPageBySlug = cache(async (slug: string): Promise<Page | null> => {
  const load = unstable_cache(
    async () => db.page.findUnique({ where: { slug } }),
    ["cms-page", slug],
    { revalidate: PAGE_TTL_SEC, tags: [pageTag(slug)] },
  );
  return hydrate(await load());
});

/**
 * Settle every SCHEDULED page whose time has passed. Called from the
 * follow-ups cron, not from a page render: promoting on read meant a GET
 * mutated the database, and it stops happening at all once that read is
 * cached. `isLive()` already counts a due SCHEDULED page as live, so a page
 * goes live on its scheduled minute either way — this just makes the stored
 * status agree, which is what the admin list and the sitemap read.
 */
export async function promoteScheduledPages(): Promise<number> {
  const due = await db.page.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
    select: { id: true, slug: true, scheduledAt: true },
    take: 200,
  });
  for (const page of due) {
    await db.page
      .update({
        where: { id: page.id },
        data: {
          status: "PUBLISHED" satisfies PageStatus,
          publishedAt: page.scheduledAt ?? new Date(),
          scheduledAt: null,
        },
      })
      .catch(() => {});
    bustPage(page.slug);
  }
  return due.length;
}
