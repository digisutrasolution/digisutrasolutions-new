import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { liveKey, type NavNode } from "@/lib/menu";
import { markDirty, parseLocation } from "@/lib/menu-admin";
import { clientIp } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const { error } = await requirePermission("menus.manage");
  if (error) return error;
  const location = parseLocation(new URL(req.url).searchParams.get("location"));
  if (!location) {
    return NextResponse.json({ ok: false, error: "Unknown menu location." }, { status: 400 });
  }
  const versions = await db.menuVersion.findMany({
    where: { location },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, authorName: true, createdAt: true },
  });
  return NextResponse.json({ ok: true, versions });
}

const RestoreSchema = z.object({ versionId: z.string().min(1) });

/** Restore: snapshot becomes live AND the draft rows are rebuilt from it. */
export async function POST(req: Request) {
  const { user, error } = await requirePermission("menus.manage");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = RestoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "versionId required." }, { status: 400 });
  }

  const version = await db.menuVersion.findUnique({ where: { id: parsed.data.versionId } });
  const location = version ? parseLocation(version.location) : null;
  if (!version || !location) {
    return NextResponse.json({ ok: false, error: "Version not found." }, { status: 404 });
  }

  const tree = version.snapshot as unknown as NavNode[];

  await db.siteSetting.upsert({
    where: { key: liveKey(location) },
    create: { key: liveKey(location), value: tree as unknown as object },
    update: { value: tree as unknown as object },
  });

  // Rebuild the draft rows to match the restored snapshot.
  await db.menuItem.deleteMany({ where: { location } });
  for (let i = 0; i < tree.length; i++) {
    const top = tree[i];
    const parent = await db.menuItem.create({
      data: {
        location,
        label: top.label,
        href: top.href,
        order: i,
        tagline: top.tagline ?? null,
        panelImage: top.panelImage ?? null,
        featured: top.featured ?? false,
        newTab: top.newTab ?? false,
      },
    });
    if (top.children?.length) {
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
          newTab: c.newTab ?? false,
        })),
      });
    }
  }
  await markDirty(location, false);
  revalidatePath("/", "layout"); // bust ISR pages so the restored nav shows immediately

  audit({
    userId: user.id,
    action: "menu.restore",
    entity: "menu",
    entityId: location,
    meta: { versionId: version.id },
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
