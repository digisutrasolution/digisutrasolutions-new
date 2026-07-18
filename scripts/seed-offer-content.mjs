/* Idempotent seed for the 2026-07-18 service-detail redesign: fills the new
   ServiceOffer.description / features / priceNote columns from
   offer-content-data.json. Offers are matched by category slug + offer name
   (case-insensitive); by default only offers with an empty description are
   written, so admin edits survive re-runs. Pass --force to overwrite anyway.

   Run on a server:  docker compose exec app node scripts/seed-offer-content.mjs */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const here = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(path.join(here, "offer-content-data.json"), "utf8"));
const force = process.argv.includes("--force");
const p = new PrismaClient();

const norm = (s) => s.trim().toLowerCase();
let written = 0, skipped = 0, missing = 0;

for (const c of data.categories) {
  const cat = await p.serviceCategory.findUnique({
    where: { slug: c.slug },
    include: { offers: true },
  });
  if (!cat) {
    console.log("MISSING category:", c.slug);
    missing += c.offers.length;
    continue;
  }
  for (const o of c.offers) {
    const row = cat.offers.find((x) => norm(x.name) === norm(o.name));
    if (!row) {
      console.log(`MISSING offer: ${c.slug} / ${o.name}`);
      missing++;
      continue;
    }
    if (row.description && !force) {
      skipped++;
      continue;
    }
    await p.serviceOffer.update({
      where: { id: row.id },
      data: { description: o.description, features: o.features, priceNote: o.priceNote },
    });
    written++;
  }
}

console.log(`done: ${written} written, ${skipped} skipped (already have content), ${missing} missing`);
await p.$disconnect();
