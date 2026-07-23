/**
 * Backfills the `layout` field on stored cards blocks.
 *
 * The cards section gained a layout option (cards | checklist | bento).
 * Blocks saved before that have no layout key at all; nothing breaks,
 * because both the renderer and the admin editor run the JSON through
 * parseSections and pick up the schema default — but the stored rows are
 * then not self-describing, and they would silently change appearance if
 * the default ever moved. This writes the value they are already using.
 *
 *   docker compose exec app node scripts/backfill-card-layout.mjs
 *
 * Idempotent and conservative: only cards blocks missing `layout` are
 * touched, existing checklist/bento choices are preserved, and a page is
 * only written when something in it actually changed.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const pages = await prisma.page.findMany();
let pagesChanged = 0;
let blocksFilled = 0;

for (const page of pages) {
  if (!Array.isArray(page.sections)) continue;

  let touched = false;
  const sections = page.sections.map((s) => {
    if (s?.type === "cards" && s.layout === undefined) {
      touched = true;
      blocksFilled += 1;
      return { ...s, layout: "cards" };
    }
    return s;
  });

  if (!touched) continue;
  await prisma.page.update({ where: { id: page.id }, data: { sections } });
  pagesChanged += 1;
  console.log(`filled /${page.slug}`);
}

console.log(
  blocksFilled
    ? `\n${blocksFilled} cards block(s) across ${pagesChanged} page(s) set to layout "cards".`
    : "\nNothing to do — every cards block already stores a layout.",
);
await prisma.$disconnect();
