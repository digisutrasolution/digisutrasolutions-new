import type { Role, WorkflowStage } from "@prisma/client";
import { can, type Permission } from "@/lib/auth/rbac";

export type WorkflowAction =
  | "submit_for_testing"
  | "test_pass"
  | "test_fail"
  | "seo_approve"
  | "seo_reject"
  | "approve"
  | "reject"
  | "reopen";

type TransitionRule = {
  from: WorkflowStage[];
  to: WorkflowStage;
  permission: Permission;
  requiresNote: boolean;
  label: string;
};

/**
 * The editorial pipeline: Draft → Testing → SEO review → Approval →
 * Approved. Rejections at any gate return the page to Draft with a
 * mandatory note so the developer knows what to fix.
 */
export const WORKFLOW_RULES: Record<WorkflowAction, TransitionRule> = {
  submit_for_testing: {
    from: ["DRAFT"],
    to: "TESTING",
    permission: "pages.edit",
    requiresNote: false,
    label: "Submit for testing",
  },
  test_pass: {
    from: ["TESTING"],
    to: "SEO_REVIEW",
    permission: "testing.review",
    requiresNote: false,
    label: "Pass testing",
  },
  test_fail: {
    from: ["TESTING"],
    to: "DRAFT",
    permission: "testing.review",
    requiresNote: true,
    label: "Fail — needs revision",
  },
  seo_approve: {
    from: ["SEO_REVIEW"],
    to: "APPROVAL",
    permission: "seo.manage",
    requiresNote: false,
    label: "SEO approved",
  },
  seo_reject: {
    from: ["SEO_REVIEW"],
    to: "DRAFT",
    permission: "seo.manage",
    requiresNote: true,
    label: "SEO — needs revision",
  },
  approve: {
    from: ["APPROVAL"],
    to: "APPROVED",
    permission: "pages.publish",
    requiresNote: false,
    label: "Approve for publish",
  },
  reject: {
    from: ["APPROVAL"],
    to: "DRAFT",
    permission: "pages.publish",
    requiresNote: true,
    label: "Reject — needs revision",
  },
  reopen: {
    from: ["APPROVED"],
    to: "DRAFT",
    permission: "pages.edit",
    requiresNote: false,
    label: "Reopen as draft",
  },
};

export const STAGE_LABELS: Record<WorkflowStage, string> = {
  DRAFT: "Draft",
  TESTING: "In testing",
  SEO_REVIEW: "SEO review",
  APPROVAL: "Awaiting approval",
  APPROVED: "Approved",
};

export const STAGE_ORDER: WorkflowStage[] = [
  "DRAFT",
  "TESTING",
  "SEO_REVIEW",
  "APPROVAL",
  "APPROVED",
];

/** Actions the given role may take from the given stage. */
export function availableActions(
  role: Role,
  stage: WorkflowStage,
): WorkflowAction[] {
  return (Object.keys(WORKFLOW_RULES) as WorkflowAction[]).filter((action) => {
    const rule = WORKFLOW_RULES[action];
    return rule.from.includes(stage) && can(role, rule.permission);
  });
}
