/**
 * Groups the services into three labelled sections in a fixed order —
 * Build & Development, then Marketing & Growth, then AI & Automation — so the
 * /services page and the contact picker read category-wise instead of the
 * interleaved order the seed left behind.
 *
 *   docker compose exec app node scripts/reorder-services.mjs
 *
 * Idempotent: it just sets `order` and `group` by slug. Unknown slugs are
 * skipped, so it is safe to re-run after adding services.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Order here IS the display order; index becomes the `order` value.
const PLAN = [
  ["Build & Development", [
    "website-design-development",
    "mobile-app-development",
    "ecommerce-development",
    "website-maintenance-security",
    "branding-ui-ux",
  ]],
  ["Marketing & Growth", [
    "seo-ai-search",
    "performance-marketing",
    "content-marketing",
    "direct-marketing",
    "influencer-marketing",
  ]],
  ["AI & Automation", [
    "ai-automation",
    "ai-development",
    "ai-customer-support",
    "crm-lead-management",
  ]],
];

let order = 0;
let updated = 0;
for (const [group, slugs] of PLAN) {
  for (const slug of slugs) {
    order += 1;
    const res = await prisma.serviceCategory.updateMany({
      where: { slug },
      data: { group, order },
    });
    if (res.count) {
      updated += 1;
      console.log(`${String(order).padStart(2, "0")}  ${slug}  →  ${group}`);
    } else {
      console.log(`--  ${slug}  (not found, skipped)`);
    }
  }
}
console.log(`\n${updated} service(s) reordered into 3 groups.`);
await prisma.$disconnect();
