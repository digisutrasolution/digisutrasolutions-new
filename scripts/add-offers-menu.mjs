/* Add "Offers & Discounts" → /offers under the Newsroom menu.
 *
 * Editing lib/menu.ts is NOT enough on a live site. A header link exists in
 * three places and the public site reads the last one:
 *
 *   1. DEFAULT_NAV in lib/menu.ts   — the fallback, used only when no snapshot
 *   2. the MenuItem rows            — what /admin/menus edits (the draft)
 *   3. SiteSetting "menu:HEADER:live" — the PUBLISHED SNAPSHOT the site renders
 *
 * So this writes the draft row and patches the snapshot in the same pass.
 * Skipping the snapshot is the classic silent no-op here: the code and the
 * admin screen both look right and the nav never changes.
 *
 * Idempotent — re-running adds nothing and overwrites nothing.
 *
 *   docker compose exec app node scripts/add-offers-menu.mjs
 */
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const LABEL = "Offers & Discounts";
const HREF = "/offers";
const ICON = "ticket";
const PARENT_LABEL = "Newsroom";

/* ---------- 1. the draft MenuItem row ---------- */
const parent = await p.menuItem.findFirst({
  where: { location: "HEADER", parentId: null, label: PARENT_LABEL },
  select: { id: true },
});

if (!parent) {
  // No rows at all means the site is still running off DEFAULT_NAV, which the
  // code change already covers. Say so rather than inventing a parent.
  console.log(
    `No "${PARENT_LABEL}" MenuItem row found — the menu has not been customised in admin, ` +
      `so the site renders DEFAULT_NAV from lib/menu.ts and the code change is enough.`,
  );
} else {
  const existing = await p.menuItem.findFirst({
    where: { location: "HEADER", parentId: parent.id, href: HREF },
    select: { id: true },
  });
  if (existing) {
    console.log("draft row: already present, left alone");
  } else {
    const last = await p.menuItem.findFirst({
      where: { parentId: parent.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    await p.menuItem.create({
      data: {
        location: "HEADER",
        parentId: parent.id,
        label: LABEL,
        href: HREF,
        icon: ICON,
        order: (last?.order ?? 0) + 1,
        visible: true,
      },
    });
    console.log("draft row: added under " + PARENT_LABEL);
  }
}

/* ---------- 2. the published snapshot ---------- */
const key = "menu:HEADER:live";
const row = await p.siteSetting.findUnique({ where: { key } });

if (!row) {
  console.log("snapshot: none published, nothing to patch (DEFAULT_NAV is live)");
} else {
  const tree = row.value;
  if (!Array.isArray(tree)) {
    console.log("snapshot: unexpected shape, left alone — publish from /admin/menus instead");
  } else {
    const node = tree.find((n) => n && n.label === PARENT_LABEL);
    if (!node) {
      console.log(`snapshot: no "${PARENT_LABEL}" node — publish from /admin/menus instead`);
    } else if ((node.children ?? []).some((c) => c && c.href === HREF)) {
      console.log("snapshot: already present, left alone");
    } else {
      node.children = [...(node.children ?? []), { label: LABEL, href: HREF, icon: ICON }];
      await p.siteSetting.update({ where: { key }, data: { value: tree } });
      console.log("snapshot: patched — the link is now live");
    }
  }
}

await p.$disconnect();
