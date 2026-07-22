/**
 * Seeds the ClientLogo table with the seven real clients whose logos the
 * owner directed us to import from the existing digisutra-alpha site.
 *
 * Idempotent: a client is only inserted when no row with that name exists,
 * so re-running never duplicates and never overwrites an admin edit. Delete
 * a row in /admin → Proof to remove a client; this script won't bring it
 * back.
 *
 * Run once per environment: docker compose exec app node scripts/seed-client-logos.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CLIENTS = [
  { name: "Denimique", imageUrl: "/trust-logos/denimique.webp" },
  { name: "Hitaaksh", imageUrl: "/trust-logos/hitaaksh.webp" },
  { name: "Jobetto", imageUrl: "/trust-logos/jobetto.webp" },
  { name: "Snakiy", imageUrl: "/trust-logos/snakiy.webp" },
  { name: "Vidytrix", imageUrl: "/trust-logos/vidytrix.webp" },
  { name: "Wallpaper Gallery", imageUrl: "/trust-logos/wallpaper-gallery.webp" },
  { name: "Kadak Chai", imageUrl: "/trust-logos/kadak-chai.webp" },
];

let added = 0;
for (let i = 0; i < CLIENTS.length; i += 1) {
  const c = CLIENTS[i];
  const existing = await prisma.clientLogo.findFirst({ where: { name: c.name } });
  if (existing) {
    console.log(`ok    ${c.name} — already present`);
    continue;
  }
  await prisma.clientLogo.create({
    data: { name: c.name, imageUrl: c.imageUrl, order: i, visible: true },
  });
  added += 1;
  console.log(`wrote ${c.name}`);
}

console.log(`\n${added} client(s) added.`);
await prisma.$disconnect();
