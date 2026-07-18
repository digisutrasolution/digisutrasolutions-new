import { cache } from "react";
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
export function isLive(page: Pick<Page, "status" | "scheduledAt">): boolean {
  if (page.status === "PUBLISHED") return true;
  return (
    page.status === "SCHEDULED" &&
    page.scheduledAt !== null &&
    page.scheduledAt <= new Date()
  );
}

export const getPageBySlug = cache(async (slug: string) => {
  return db.page.findUnique({ where: { slug } });
});

export async function promoteDueScheduledPage(page: Page): Promise<Page> {
  if (page.status === "SCHEDULED" && isLive(page)) {
    return db.page.update({
      where: { id: page.id },
      data: {
        status: "PUBLISHED" satisfies PageStatus,
        publishedAt: page.scheduledAt ?? new Date(),
        scheduledAt: null,
      },
    });
  }
  return page;
}
