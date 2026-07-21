import { z } from "zod";
import { db } from "@/lib/db";
import {
  DEFAULT_NAV_BY_LOCATION,
  MENU_LOCATIONS,
  type MenuLocation,
  type NavChild,
  type NavNode,
  dirtyKey,
  itemsToTree,
  liveKey,
} from "@/lib/menu";

const LOCATION_KEYS = MENU_LOCATIONS.map((l) => l.key) as [MenuLocation, ...MenuLocation[]];
export const LocationSchema = z.enum(LOCATION_KEYS);

export function parseLocation(value: string | null): MenuLocation | null {
  const parsed = LocationSchema.safeParse(value ?? "HEADER");
  return parsed.success ? parsed.data : null;
}

/* Server-side helpers shared by the /api/menus routes. */

const hrefField = z
  .string()
  .trim()
  .min(1)
  .max(600)
  .refine(
    (v) =>
      v.startsWith("/") || v.startsWith("#") || v.startsWith("https://") || v.startsWith("http://"),
    { message: "Must be a path (/…), #anchor or a full URL." },
  );

export const ItemSchema = z.object({
  label: z.string().trim().min(1).max(80),
  href: hrefField,
  parentId: z.string().nullable().optional(),
  icon: z.string().trim().max(40).nullable().optional(),
  group: z.string().trim().max(60).nullable().optional(),
  badge: z.string().trim().max(12).nullable().optional(),
  description: z.string().trim().max(200).nullable().optional(),
  visible: z.boolean().optional(),
  newTab: z.boolean().optional(),
  panelImage: z.string().trim().max(600).nullable().optional(),
  tagline: z.string().trim().max(200).nullable().optional(),
  featured: z.boolean().optional(),
});

export async function markDirty(location: string, dirty = true) {
  await db.siteSetting.upsert({
    where: { key: dirtyKey(location) },
    create: { key: dirtyKey(location), value: dirty },
    update: { value: dirty },
  });
}

/** Write a NavNode/NavChild tree into draft rows at any depth. Shared by
    bootstrap, version restore and JSON import. */
export async function createTreeRows(
  location: string,
  nodes: (NavNode | NavChild)[],
  parentId: string | null = null,
  depth = 0,
  orderOffset = 0,
): Promise<number> {
  if (depth > MAX_MENU_DEPTH) return 0;
  let written = 0;
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i] as NavNode & NavChild;
    const row = await db.menuItem.create({
      data: {
        location,
        parentId,
        label: n.label,
        href: n.href,
        order: orderOffset + i,
        icon: n.icon ?? null,
        group: n.group ?? null,
        badge: n.badge ?? null,
        description: n.description ?? null,
        newTab: n.newTab ?? false,
        tagline: n.tagline ?? null,
        panelImage: n.panelImage ?? null,
        featured: n.featured ?? false,
      },
    });
    written++;
    if (n.children?.length) {
      written += await createTreeRows(location, n.children, row.id, depth + 1);
    }
  }
  return written;
}

/** Seed draft rows from the location's defaults the first time it loads.
    Trashed rows count, so emptying a menu never silently re-seeds it. */
export async function bootstrapIfEmpty(location: MenuLocation) {
  const count = await db.menuItem.count({ where: { location } });
  if (count > 0) return;
  await createTreeRows(location, DEFAULT_NAV_BY_LOCATION[location] ?? []);
}

/* Nesting is unbounded by design; this is a safety cap so a runaway import
   or a bad drag can't build a tree the renderers have to walk forever. */
export const MAX_MENU_DEPTH = 8;

/** How deep an item sits (0 = top level). */
export async function menuDepth(id: string): Promise<number> {
  let depth = 0;
  let cur = await db.menuItem.findUnique({ where: { id }, select: { parentId: true } });
  while (cur?.parentId && depth < MAX_MENU_DEPTH + 2) {
    depth++;
    cur = await db.menuItem.findUnique({
      where: { id: cur.parentId },
      select: { parentId: true },
    });
  }
  return depth;
}

/** Deepest level below an item (0 when it has no children). */
export async function subtreeHeight(id: string): Promise<number> {
  let height = 0;
  let frontier = [id];
  for (let d = 0; d < MAX_MENU_DEPTH + 2 && frontier.length; d++) {
    const kids = await db.menuItem.findMany({
      where: { parentId: { in: frontier }, deletedAt: null },
      select: { id: true },
    });
    if (!kids.length) break;
    frontier = kids.map((k) => k.id);
    height++;
  }
  return height;
}

/** Every descendant id of an item (self excluded), depth-safe. */
export async function descendantIds(id: string): Promise<string[]> {
  const out: string[] = [];
  let frontier = [id];
  for (let depth = 0; depth < 12 && frontier.length; depth++) {
    const kids = await db.menuItem.findMany({
      where: { parentId: { in: frontier } },
      select: { id: true },
    });
    frontier = kids.map((k) => k.id);
    out.push(...frontier);
  }
  return out;
}

/** Serialize the current draft tree and make it the live nav. */
export async function publishMenu(location: string, authorName?: string | null) {
  const items = await db.menuItem.findMany({ where: { location, deletedAt: null } });
  const tree = itemsToTree(items);
  await db.siteSetting.upsert({
    where: { key: liveKey(location) },
    create: { key: liveKey(location), value: tree as object },
    update: { value: tree as object },
  });
  const version = await db.menuVersion.create({
    data: { location, snapshot: tree as object, authorName: authorName ?? null },
  });
  await markDirty(location, false);
  return { tree, version };
}
