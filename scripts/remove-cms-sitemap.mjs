/**
 * The human-readable sitemap is now a coded route (app/(site)/sitemap), which
 * wins over the [...slug] CMS catch-all. That leaves the old CMS "sitemap" page
 * unreachable — remove it so it doesn't linger in the admin Pages list.
 *
 *   docker compose exec app node scripts/remove-cms-sitemap.mjs
 *
 * Idempotent: does nothing if the page is already gone.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const page = await prisma.page.findFirst({ where: { slug: "sitemap" } });
if (page) {
  await prisma.page.delete({ where: { id: page.id } });
  console.log(`Removed stale CMS /sitemap page (${page.id}); the coded route now serves /sitemap.`);
} else {
  console.log("No CMS /sitemap page found — nothing to remove.");
}

await prisma.$disconnect();
