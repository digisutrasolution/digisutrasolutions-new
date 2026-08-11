import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import { SectionsSchema } from "@/lib/cms/sections";
import { STARTER_TEMPLATES } from "@/lib/cms/starter-templates";

/* Install the starter landing-page templates.

   Idempotent by slug: running it twice adds nothing and overwrites nothing,
   so a team that has edited a starter never loses that work. Missing ones are
   added, which is what makes this safe to offer as a button rather than a
   one-shot seed script. */

export async function POST(req: Request) {
  const { user, error } = await requirePermission("pages.create");
  if (error) return error;

  const slugs = STARTER_TEMPLATES.map((t) => t.slug);
  const existing = await db.page.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true },
  });
  const have = new Set(existing.map((p) => p.slug));
  const missing = STARTER_TEMPLATES.filter((t) => !have.has(t.slug));

  const created: string[] = [];
  for (const tpl of missing) {
    /* Parsed, not trusted. The union fills defaults and drops anything
       malformed — better to find a bad block here than to ship a template
       that silently renders one section short. */
    const parsed = SectionsSchema.safeParse(tpl.sections);
    if (!parsed.success) continue;
    const sections = parsed.data as unknown as Prisma.InputJsonValue;

    const page = await db.page
      .create({
        data: {
          title: tpl.title,
          slug: tpl.slug,
          kind: "TEMPLATE",
          status: "DRAFT",
          sections,
          // Templates never render publicly (isLive gates on kind), but the
          // flag keeps them out of the sitemap query too.
          noIndex: true,
          createdById: user.id,
          updatedById: user.id,
          versions: {
            create: {
              version: 1,
              title: tpl.title,
              sections,
              seoSnapshot: {},
              note: "Installed from starter templates",
              createdById: user.id,
              createdByName: user.name,
            },
          },
        },
        select: { slug: true },
      })
      .catch(() => null);
    if (page) created.push(page.slug);
  }

  if (created.length > 0) {
    audit({
      userId: user.id,
      action: "page.starterTemplates",
      entity: "page",
      entityId: "starter-templates",
      meta: { created },
      ip: clientIp(req),
    });
  }

  return NextResponse.json({
    ok: true,
    created: created.length,
    skipped: STARTER_TEMPLATES.length - created.length,
  });
}
