/**
 * Gives each service a starting group, used as a heading in the contact
 * form's service picker.
 *
 * Idempotent and non-destructive: only services whose group is still empty
 * are touched, so anything set in admin wins. Services not listed here
 * simply render without a heading, at the end of the list.
 *
 * Run once per environment: node scripts/seed-service-groups.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GROUPS = {
  "Marketing and growth": [
    "SEO + AI Search Optimization",
    "Performance Marketing",
    "Content Marketing",
    "Direct Marketing",
    "Influencer Marketing",
  ],
  "Build and design": [
    "Website Design & Development",
    "Ecommerce Development",
    "Mobile App Development",
    "Branding & UI/UX",
    "Website Maintenance & Security",
  ],
  "AI and automation": [
    "AI Automation",
    "AI Development",
    "AI Customer Support",
    "CRM & Lead Management",
  ],
};

let changed = 0;

for (const [group, names] of Object.entries(GROUPS)) {
  const res = await prisma.serviceCategory.updateMany({
    where: { name: { in: names }, OR: [{ group: null }, { group: "" }] },
    data: { group },
  });
  changed += res.count;
  console.log(`${group}: ${res.count} service(s) set`);
}

const ungrouped = await prisma.serviceCategory.count({
  where: { OR: [{ group: null }, { group: "" }] },
});
console.log(`\n${changed} service(s) updated. ${ungrouped} still ungrouped.`);
await prisma.$disconnect();
