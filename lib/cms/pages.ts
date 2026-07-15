import { cache } from "react";
import { db } from "@/lib/db";
import type { Page, PageStatus } from "@prisma/client";

/** Slugs that would shadow real routes or static assets. */
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "work",
  "login",
  "sitemap.xml",
  "robots.txt",
  "favicon.ico",
  "videos",
  "_next",
]);

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
