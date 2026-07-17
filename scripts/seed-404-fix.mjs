/* Idempotent data seed for the 2026-07-18 404-fix: 8 service categories
   (for menu slugs added by the owner) + 20 starter CMS pages. Existing
   slugs are skipped, so re-running is always safe.

   Run on a server:  docker compose exec app node scripts/seed-404-fix.mjs */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const here = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(path.join(here, "fix-404-data.json"), "utf8"));
const p = new PrismaClient();

let last = await p.serviceCategory.findFirst({ orderBy: { order: "desc" } });
let order = (last?.order ?? -1) + 1;

for (const c of data.categories) {
  if (await p.serviceCategory.findUnique({ where: { slug: c.slug } })) {
    console.log("category exists:", c.slug);
    continue;
  }
  const { offers, ...fields } = c;
  await p.serviceCategory.create({
    data: {
      ...fields,
      order: order++,
      offers: { create: offers.map((o, j) => ({ ...o, order: j })) },
    },
  });
  console.log("category created:", c.slug);
}

for (const pg of data.pages) {
  if (await p.page.findUnique({ where: { slug: pg.slug } })) {
    console.log("page exists:", pg.slug);
    continue;
  }
  await p.page.create({
    data: {
      ...pg,
      status: "PUBLISHED",
      workflowStage: "APPROVED",
      publishedAt: new Date(),
    },
  });
  console.log("page created:", pg.slug);
}

console.log("seed complete");
await p.$disconnect();
