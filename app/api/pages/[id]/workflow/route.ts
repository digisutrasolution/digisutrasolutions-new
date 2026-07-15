import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import {
  WORKFLOW_RULES,
  availableActions,
  type WorkflowAction,
} from "@/lib/cms/workflow";
import { notifyRoles } from "@/lib/notify";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!can(user.role, "pages.view")) {
    return NextResponse.json(
      { ok: false, error: "You don't have permission for this action." },
      { status: 403 },
    );
  }
  const { id } = await params;

  const page = await db.page.findUnique({
    where: { id },
    select: { id: true, title: true, workflowStage: true },
  });
  if (!page) {
    return NextResponse.json(
      { ok: false, error: "Page not found." },
      { status: 404 },
    );
  }

  const [transitions, comments, bugs] = await Promise.all([
    db.workflowTransition.findMany({
      where: { pageId: id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.pageComment.findMany({
      where: { pageId: id },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
    db.bugReport.findMany({
      where: { pageId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return NextResponse.json({
    ok: true,
    stage: page.workflowStage,
    actions: availableActions(user.role, page.workflowStage).map((action) => ({
      action,
      label: WORKFLOW_RULES[action].label,
      requiresNote: WORKFLOW_RULES[action].requiresNote,
    })),
    canComment: true,
    canReportBug: can(user.role, "testing.review"),
    canResolveBug:
      can(user.role, "testing.review") || can(user.role, "pages.edit"),
    transitions,
    comments,
    bugs,
  });
}

const TransitionSchema = z.object({
  action: z.enum(Object.keys(WORKFLOW_RULES) as [WorkflowAction, ...WorkflowAction[]]),
  note: z.string().trim().max(1000).optional(),
});

export async function POST(req: Request, { params }: Params) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = TransitionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid workflow action." },
      { status: 400 },
    );
  }

  const rule = WORKFLOW_RULES[parsed.data.action];
  if (!can(user.role, rule.permission)) {
    return NextResponse.json(
      { ok: false, error: "Your role cannot perform this transition." },
      { status: 403 },
    );
  }
  if (rule.requiresNote && !parsed.data.note) {
    return NextResponse.json(
      { ok: false, error: "A note explaining the decision is required." },
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
  if (!rule.from.includes(page.workflowStage)) {
    return NextResponse.json(
      {
        ok: false,
        error: `This action isn't available from the "${page.workflowStage}" stage.`,
      },
      { status: 409 },
    );
  }

  const [updated] = await db.$transaction([
    db.page.update({
      where: { id },
      data: { workflowStage: rule.to, updatedById: user.id },
    }),
    db.workflowTransition.create({
      data: {
        pageId: id,
        from: page.workflowStage,
        to: rule.to,
        note: parsed.data.note,
        byId: user.id,
        byName: user.name,
      },
    }),
  ]);

  const link = `/admin/pages/${id}`;
  const note = parsed.data.note;
  switch (parsed.data.action) {
    case "submit_for_testing":
      void notifyRoles(
        ["TESTER", "SUPER_ADMIN"],
        { type: "workflow", title: `"${page.title}" submitted for testing`, link },
        { excludeUserId: user.id },
      );
      break;
    case "test_pass":
      void notifyRoles(
        ["SEO_MANAGER", "SUPER_ADMIN"],
        { type: "workflow", title: `"${page.title}" passed testing — SEO review next`, link },
        { excludeUserId: user.id },
      );
      break;
    case "test_fail":
      void notifyRoles(
        ["DEVELOPER", "SUPER_ADMIN"],
        { type: "workflow", title: `Testing failed: "${page.title}"`, body: note, link },
        { excludeUserId: user.id },
      );
      break;
    case "seo_approve":
      void notifyRoles(
        ["SUPER_ADMIN"],
        { type: "workflow", title: `SEO review complete: "${page.title}" awaits approval`, link },
        { excludeUserId: user.id },
      );
      break;
    case "seo_reject":
      void notifyRoles(
        ["DEVELOPER", "SUPER_ADMIN"],
        { type: "workflow", title: `SEO changes requested: "${page.title}"`, body: note, link },
        { excludeUserId: user.id },
      );
      break;
    case "approve":
      void notifyRoles(
        ["DEVELOPER", "SEO_MANAGER"],
        { type: "workflow", title: `Publish approved: "${page.title}"`, link },
        { excludeUserId: user.id },
      );
      break;
    case "reject":
      void notifyRoles(
        ["DEVELOPER"],
        { type: "workflow", title: `Approval rejected: "${page.title}"`, body: note, link },
        { excludeUserId: user.id },
      );
      break;
    case "reopen":
      break;
  }

  audit({
    userId: user.id,
    action: `workflow.${parsed.data.action}`,
    entity: "page",
    entityId: id,
    meta: { from: page.workflowStage, to: rule.to, note },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, stage: updated.workflowStage });
}
