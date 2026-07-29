/**
 * Aligns the HEADER "Services" menu with the /services page: the 14 services
 * are grouped Build & Development → Marketing & Growth → AI & Automation, in the
 * same order, and the three group labels are unified across both surfaces.
 *
 *   docker compose exec app node scripts/reorder-menu-services.mjs
 *
 * It updates BOTH the draft MenuItem rows AND the published snapshot
 * (siteSetting "menu:HEADER:live") — the site renders the snapshot, so without
 * that write the menu would look unchanged. Idempotent; matches by URL slug so
 * it is safe to re-run. Unknown items are left where they are.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// slug (last path segment) → { order, group }. Order is the display order.
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

const bySlug = new Map();
let n = 0;
for (const [group, slugs] of PLAN) {
  for (const slug of slugs) {
    n += 1;
    bySlug.set(slug, { order: n, group });
  }
}
const slugOf = (href = "") => href.split("?")[0].replace(/\/$/, "").split("/").pop();

// 1) Draft MenuItem rows (admin tree + bootstrap source).
const header = await prisma.menuItem.findMany({ where: { location: "HEADER" } });
const svc = header.find((i) => !i.parentId && /^\/services\/?$/.test(i.href));
let rows = 0;
if (svc) {
  const kids = header.filter((i) => i.parentId === svc.id);
  for (const k of kids) {
    const plan = bySlug.get(slugOf(k.href));
    if (!plan) continue;
    await prisma.menuItem.update({
      where: { id: k.id },
      data: { order: plan.order, group: plan.group },
    });
    rows += 1;
  }
}
console.log(`MenuItem rows updated: ${rows}`);

// 2) Published snapshot (what the public site renders).
const liveKey = "menu:HEADER:live";
const row = await prisma.siteSetting.findUnique({ where: { key: liveKey } });
if (row && Array.isArray(row.value)) {
  const nav = row.value;
  const services = nav.find((node) => /^\/services\/?$/.test(node?.href || ""));
  if (services && Array.isArray(services.children)) {
    const rank = (c) => bySlug.get(slugOf(c.href))?.order ?? 999;
    services.children = services.children
      .map((c) => {
        const plan = bySlug.get(slugOf(c.href));
        return plan ? { ...c, group: plan.group } : c;
      })
      .sort((a, b) => rank(a) - rank(b));
    await prisma.siteSetting.update({
      where: { key: liveKey },
      data: { value: nav },
    });
    console.log(`Live snapshot: ${services.children.length} services regrouped.`);
  } else {
    console.log("Live snapshot: no Services node found (skipped).");
  }
} else {
  console.log("Live snapshot: none published (site uses DEFAULT_NAV — already updated in code).");
}

await prisma.$disconnect();
