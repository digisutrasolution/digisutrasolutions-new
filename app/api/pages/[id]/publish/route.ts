import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

const ActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("publish"), force: z.boolean().optional() }),
  z.object({ action: z.literal("unpublish") }),
  z.object({ action: z.literal("archive") }),
  z.object({ action: z.literal("restore") }),
  z.object({
    action: z.literal("schedule"),
    force: z.boolean().optional(),
    scheduledAt: z.coerce.date().refine((d) => d > new Date(), {
      message: "Schedule time must be in the future.",
    }),
  }),
]);

export async function POST(req: Request, { params }: Params) {
  const { user, error } = await requirePermission("pages.publish");
  if (error) return error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid action." },
      { status: 400 },
    );
  }

  const page = await db.page.findUnique({ where: { id } });
  if (!page) {
    return NextResponse.json(
      { ok: false, error: "Page not found." },
      { status: 404 },
    );
  }

  const input = parsed.data;

  // Workflow gate: going live requires an APPROVED pipeline stage. A
  // Super Admin may force past it; the override is recorded in the audit.
  const goesLive = input.action === "publish" || input.action === "schedule";
  const forced = goesLive && input.force === true;
  if (goesLive && page.workflowStage !== "APPROVED" && !forced) {
    return NextResponse.json(
      {
        ok: false,
        error: `Page is at "${page.workflowStage}" — complete the workflow (or force-publish) before going live.`,
        requiresApproval: true,
      },
      { status: 409 },
    );
  }

  const data =
    input.action === "publish"
      ? { status: "PUBLISHED" as const, publishedAt: new Date(), scheduledAt: null }
      : input.action === "unpublish"
        ? { status: "DRAFT" as const, scheduledAt: null }
        : input.action === "archive"
          ? { status: "ARCHIVED" as const, scheduledAt: null }
          : input.action === "restore"
            ? { status: "DRAFT" as const }
            : {
                status: "SCHEDULED" as const,
                scheduledAt: input.action === "schedule" ? input.scheduledAt : null,
              };

  const updated = await db.page.update({
    where: { id },
    data: { ...data, updatedById: user.id },
  });

  audit({
    userId: user.id,
    action: `page.${input.action}`,
    entity: "page",
    entityId: id,
    meta: {
      slug: page.slug,
      ...(forced ? { forcedPastWorkflow: true, stage: page.workflowStage } : {}),
      ...(input.action === "schedule"
        ? { scheduledAt: input.scheduledAt.toISOString() }
        : {}),
    },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, page: updated });
}
