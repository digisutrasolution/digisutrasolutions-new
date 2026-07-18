/* Idempotent seed for the 2026-07-18 FAQ system: inserts the 22-question
   bank (8 home originals + 14 new, category-ordered) from
   faq-content-data.json. Matched by question text — existing rows are left
   untouched, so re-running is always safe and admin edits survive.

   Run on a server:  docker compose exec app node scripts/seed-faq-content.mjs */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const here = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(path.join(here, "faq-content-data.json"), "utf8"));
const p = new PrismaClient();

const existing = await p.faqItem.findMany();
const norm = (s) => s.trim().toLowerCase();
const have = new Set(existing.map((f) => norm(f.question)));
let order = existing.reduce((m, f) => Math.max(m, f.order), -1) + 1;
let created = 0;

for (const f of data.faqs) {
  if (have.has(norm(f.question))) continue;
  await p.faqItem.create({
    data: {
      question: f.question,
      lead: f.lead,
      rest: f.rest,
      category: f.category,
      icon: f.icon ?? null,
      featured: f.featured ?? false,
      order: order++,
    },
  });
  created++;
}

console.log(`done: ${created} created, ${data.faqs.length - created} already present`);
await p.$disconnect();
