/* Put "Offers" → /offers in the header nav, as a top-level item after Pricing.
 *
 * Editing lib/menu.ts is NOT enough on a live site. A header link exists in
 * three places and the public site reads the last one:
 *
 *   1. DEFAULT_NAV in lib/menu.ts     — the fallback, used only when no snapshot
 *   2. the MenuItem rows              — what /admin/menus edits (the draft)
 *   3. SiteSetting "menu:HEADER:live" — the PUBLISHED SNAPSHOT the site renders
 *
 * So this writes the draft row and patches the snapshot in the same pass.
 * Skipping the snapshot is the classic silent no-op here: the code and the
 * admin screen both look right and the nav never changes.
 *
 * Also migrates: an earlier version of this script filed the link under the
 * Newsroom menu. If it is there, it is removed first — so running this once
 * lands the link in the right place whichever version ran before.
 *
 * Idempotent — re-running adds nothing and overwrites nothing.
 *
 *   docker compose exec app node scripts/add-offers-menu.mjs
 */
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const LABEL = "Offers";
const HREF = "/offers";
const AFTER = "Pricing";
const OLD_PARENT = "Newsroom";

/* ---------------- 1. draft MenuItem rows ---------------- */

// 1a. remove the old nested copy, if the earlier version of this script ran.
const stale = await p.menuItem.findMany({
  where: { location: "HEADER", href: HREF, parent: { label: OLD_PARENT } },
  select: { id: true },
});
if (stale.length) {
  await p.menuItem.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
  console.log(`draft rows: removed ${stale.length} stale copy under ${OLD_PARENT}`);
}

// 1b. ensure the top-level row exists, ordered right after Pricing.
const anyRows = await p.menuItem.count({ where: { location: "HEADER" } });
if (anyRows === 0) {
  // Never customised in admin, so the site renders DEFAULT_NAV and the code
  // change already covers it. Say so rather than inventing rows.
  console.log("draft rows: menu not customised — DEFAULT_NAV is live, code change is enough");
} else {
  const existing = await p.menuItem.findFirst({
    where: { location: "HEADER", parentId: null, href: HREF },
    select: { id: true },
  });
  if (existing) {
    console.log("draft row: already present at top level, left alone");
  } else {
    const pricing = await p.menuItem.findFirst({
      where: { location: "HEADER", parentId: null, label: AFTER },
      select: { order: true },
    });
    const at = pricing ? pricing.order + 1 : 999;
    // Shuffle everything at or after that slot down one so the new item slots
    // in rather than tying with whatever already holds that order value.
    if (pricing) {
      await p.menuItem.updateMany({
        where: { location: "HEADER", parentId: null, order: { gte: at } },
        data: { order: { increment: 1 } },
      });
    }
    await p.menuItem.create({
      data: { location: "HEADER", parentId: null, label: LABEL, href: HREF, order: at, visible: true },
    });
    console.log(`draft row: added at top level after ${AFTER}`);
  }
}

/* ---------------- 2. the published snapshot ---------------- */
const key = "menu:HEADER:live";
const row = await p.siteSetting.findUnique({ where: { key } });

if (!row) {
  console.log("snapshot: none published, nothing to patch (DEFAULT_NAV is live)");
} else if (!Array.isArray(row.value)) {
  console.log("snapshot: unexpected shape, left alone — publish from /admin/menus instead");
} else {
  const tree = row.value;
  let changed = false;

  // 2a. drop the old nested copy.
  for (const node of tree) {
    if (!node?.children?.length) continue;
    const kept = node.children.filter((c) => c?.href !== HREF);
    if (kept.length !== node.children.length) {
      node.children = kept;
      changed = true;
      console.log(`snapshot: removed stale copy under ${node.label}`);
    }
  }

  // 2b. add at top level after Pricing.
  if (tree.some((n) => n?.href === HREF)) {
    console.log("snapshot: already present at top level, left alone");
  } else {
    const i = tree.findIndex((n) => n?.label === AFTER);
    tree.splice(i === -1 ? tree.length : i + 1, 0, { label: LABEL, href: HREF });
    changed = true;
    console.log(`snapshot: added at top level after ${AFTER}`);
  }

  if (changed) {
    await p.siteSetting.update({ where: { key }, data: { value: tree } });
    console.log("snapshot: saved — the link is now live");
  }
}

await p.$disconnect();
