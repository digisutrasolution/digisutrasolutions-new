import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { error } = await requirePermission("pages.view");
  if (error) return error;
  const { id } = await params;

  const versions = await db.pageVersion.findMany({
    where: { pageId: id },
    orderBy: { version: "desc" },
    take: 50,
    select: {
      version: true,
      title: true,
      note: true,
      createdByName: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ ok: true, versions });
}

const RestoreSchema = z.object({ version: z.number().int().positive() });

/** Restore a snapshot: copies it onto the page and records a new version. */
export async function POST(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("pages.edit");
  if (error) return error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = RestoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Specify a version to restore." },
      { status: 400 },
    );
  }

  const snapshot = await db.pageVersion.findUnique({
    where: { pageId_version: { pageId: id, version: parsed.data.version } },
  });
  if (!snapshot) {
    return NextResponse.json(
      { ok: false, error: "Version not found." },
      { status: 404 },
    );
  }

  const updated = await db.$transaction(async (tx) => {
    const result = await tx.page.update({
      where: { id },
      data: {
        title: snapshot.title,
        sections: snapshot.sections as Prisma.InputJsonValue,
        updatedById: user.id,
      },
    });
    const last = await tx.pageVersion.findFirst({
      where: { pageId: id },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    await tx.pageVersion.create({
      data: {
        pageId: id,
        version: (last?.version ?? 0) + 1,
        title: snapshot.title,
        sections: snapshot.sections as Prisma.InputJsonValue,
        seoSnapshot: snapshot.seoSnapshot as Prisma.InputJsonValue,
        note: `Restored v${snapshot.version}`,
        createdById: user.id,
        createdByName: user.name,
      },
    });
    return result;
  });

  audit({
    userId: user.id,
    action: "page.restore_version",
    entity: "page",
    entityId: id,
    meta: { restored: parsed.data.version },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, page: updated });
}
