/* One-off repair: the Free Tools menu was saved with "/tree-tools" instead
   of "/free-tools" (typo), so 18 links 404. Rewrites the draft MenuItem
   rows AND the published snapshot in place — nothing else in the menu is
   touched, and re-running is harmless.

   Run on a server:  docker compose exec app node scripts/fix-free-tools-menu.mjs */
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const BAD = "/tree-tools";
const GOOD = "/free-tools";

// 1. draft rows
const rows = await p.menuItem.findMany({ where: { href: { startsWith: BAD } } });
for (const r of rows) {
  await p.menuItem.update({
    where: { id: r.id },
    data: { href: r.href.replace(BAD, GOOD) },
  });
}
console.log(`draft rows fixed: ${rows.length}`);

// 2. published snapshots (public site renders these)
const keys = ["menu:HEADER:live", "menu:FOOTER:live", "menu:FOOTER_LEGAL:live"];
let snapshots = 0;
for (const key of keys) {
  const row = await p.siteSetting.findUnique({ where: { key } });
  if (!row) continue;
  const json = JSON.stringify(row.value);
  if (!json.includes(BAD)) continue;
  await p.siteSetting.update({
    where: { key },
    data: { value: JSON.parse(json.split(BAD).join(GOOD)) },
  });
  snapshots++;
}
console.log(`snapshots fixed: ${snapshots}`);

const left = await p.menuItem.count({ where: { href: { contains: BAD } } });
console.log(left === 0 ? "no /tree-tools links remain" : `WARNING: ${left} draft rows still contain ${BAD}`);
await p.$disconnect();
