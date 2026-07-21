import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { itemsToTree } from "@/lib/menu";
import { createTreeRows, markDirty, parseLocation } from "@/lib/menu-admin";
import { clientIp } from "@/lib/rate-limit";

/* Portable menu JSON: the same NavNode tree the public site consumes, so an
   export can be reviewed by hand, kept in version control, or moved between
   environments. */

type ImportNode = {
  label: string;
  href: string;
  icon?: string;
  group?: string;
  badge?: string;
  description?: string;
  newTab?: boolean;
  tagline?: string;
  panelImage?: string;
  featured?: boolean;
  children?: ImportNode[];
};

const NodeSchema: z.ZodType<ImportNode> = z.lazy(() =>
  z.object({
    label: z.string().trim().min(1).max(80),
    href: z.string().trim().min(1).max(600),
    icon: z.string().trim().max(40).optional(),
    group: z.string().trim().max(60).optional(),
    badge: z.string().trim().max(12).optional(),
    description: z.string().trim().max(200).optional(),
    newTab: z.boolean().optional(),
    tagline: z.string().trim().max(200).optional(),
    panelImage: z.string().trim().max(600).optional(),
    featured: z.boolean().optional(),
    children: z.array(NodeSchema).max(200).optional(),
  }),
);

const ImportSchema = z.object({
  location: z.string(),
  mode: z.enum(["replace", "append"]).default("append"),
  tree: z.array(NodeSchema).min(1).max(200),
});

/** GET /api/menus/io?location=HEADER — export the draft tree as JSON. */
export async function GET(req: Request) {
  const { error } = await requirePermission("menus.manage");
  if (error) return error;
  const location = parseLocation(new URL(req.url).searchParams.get("location"));
  if (!location) {
    return NextResponse.json({ ok: false, error: "Unknown menu location." }, { status: 400 });
  }

  const items = await db.menuItem.findMany({ where: { location, deletedAt: null } });
  const tree = itemsToTree(items, { includeHidden: true });
  return NextResponse.json(
    { location, exportedAt: new Date().toISOString(), tree },
    {
      headers: {
        "Content-Disposition": `attachment; filename="menu-${location.toLowerCase()}.json"`,
      },
    },
  );
}

/** POST /api/menus/io — import a tree, replacing or appending to the draft. */
export async function POST(req: Request) {
  const { user, error } = await requirePermission("menus.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = ImportSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { ok: false, error: `${issue?.path.join(".") || "file"}: ${issue?.message ?? "Invalid menu JSON."}` },
      { status: 400 },
    );
  }
  const location = parseLocation(parsed.data.location);
  if (!location) {
    return NextResponse.json({ ok: false, error: "Unknown menu location." }, { status: 400 });
  }
  const { mode, tree } = parsed.data;

  if (mode === "replace") {
    await db.menuItem.deleteMany({ where: { location } });
  }
  const startOrder = await db.menuItem.count({ where: { location, parentId: null, deletedAt: null } });
  const written = await createTreeRows(location, tree, null, 0, startOrder);
  await markDirty(location);

  audit({
    userId: user.id,
    action: "menu.import",
    entity: "menu",
    entityId: location,
    meta: { mode, topLevel: tree.length, itemsWritten: written },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, imported: written, mode });
}
