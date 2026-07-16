import { z } from "zod";
import { db } from "@/lib/db";
import {
  DEFAULT_NAV_BY_LOCATION,
  MENU_LOCATIONS,
  type MenuLocation,
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

/** Seed draft rows from the location's defaults the first time it loads. */
export async function bootstrapIfEmpty(location: MenuLocation) {
  const count = await db.menuItem.count({ where: { location } });
  if (count > 0) return;
  const defaults = DEFAULT_NAV_BY_LOCATION[location] ?? [];
  for (let i = 0; i < defaults.length; i++) {
    const top = defaults[i];
    const parent = await db.menuItem.create({
      data: {
        location,
        label: top.label,
        href: top.href,
        order: i,
        tagline: top.tagline ?? null,
        panelImage: top.panelImage ?? null,
        featured: top.featured ?? false,
      },
    });
    if (top.children) {
      await db.menuItem.createMany({
        data: top.children.map((c, j) => ({
          location,
          parentId: parent.id,
          label: c.label,
          href: c.href,
          order: j,
          icon: c.icon ?? null,
          group: c.group ?? null,
          badge: c.badge ?? null,
          description: c.description ?? null,
        })),
      });
    }
  }
}

/** Serialize the current draft tree and make it the live nav. */
export async function publishMenu(location: string, authorName?: string | null) {
  const items = await db.menuItem.findMany({ where: { location } });
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
