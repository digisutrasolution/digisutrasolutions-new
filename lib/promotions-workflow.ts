import type { PromotionStatus } from "@prisma/client";
import type { Permission } from "@/lib/auth/rbac";

/* The promotion lifecycle.

   Deliberately the same shape as lib/cms/workflow.ts — from/to/permission/
   requiresNote/label, and an availableActions() the UI drives off — because a
   second vocabulary for the same idea is a thing to learn twice.

   What is different, and why:

   - Pages have four gates because four kinds of person look at them. A
     promotion has one thing worth checking, and it is not spelling: can we
     afford this. So there is one review step, not four.

   - The gate is enforced author-vs-approver, NOT by role. promos.manage is
     Super Admin only, so a role check would gate precisely nothing — everyone
     who can reach the screen would pass it. Four eyes has to mean two people.

   - PAUSED exists because the old isActive boolean conflated two different
     decisions: stop issuing new codes, and invalidate the codes already out
     there. Those need to be separable, or pausing an offer quietly breaks a
     promise to everyone holding a code. */

export type PromotionAction =
  | "submit"
  | "approve"
  | "send_back"
  | "pause"
  | "resume"
  | "end"
  | "reopen";

export type TransitionRule = {
  from: PromotionStatus[];
  /** null = computed from the promotion's dates, see resolveApprovedStatus. */
  to: PromotionStatus | null;
  permission: Permission;
  requiresNote: boolean;
  /** The approver must not be the author. Only meaningful on `approve`. */
  requiresSecondPerson: boolean;
  label: string;
  /** Shown as the confirm prompt / button title where the effect is not obvious. */
  hint?: string;
};

export const PROMOTION_RULES: Record<PromotionAction, TransitionRule> = {
  submit: {
    from: ["DRAFT"],
    to: "IN_REVIEW",
    permission: "promos.manage",
    requiresNote: false,
    requiresSecondPerson: false,
    label: "Submit for review",
    hint: "Locks the offer until someone else approves it.",
  },
  approve: {
    from: ["IN_REVIEW"],
    // LIVE or SCHEDULED depending on startsAt — resolved at transition time.
    to: null,
    permission: "promos.approve",
    requiresNote: false,
    requiresSecondPerson: true,
    label: "Approve",
    hint: "Goes live now, or on its start date if one is set.",
  },
  send_back: {
    from: ["IN_REVIEW"],
    to: "DRAFT",
    permission: "promos.approve",
    requiresNote: true,
    requiresSecondPerson: false,
    label: "Send back",
    hint: "Returns it to draft with a note saying why.",
  },
  pause: {
    from: ["LIVE", "SCHEDULED"],
    to: "PAUSED",
    permission: "promos.manage",
    requiresNote: true,
    requiresSecondPerson: false,
    label: "Pause",
    hint: "Stops new claims. Codes already issued stay valid.",
  },
  resume: {
    from: ["PAUSED"],
    to: null,
    permission: "promos.manage",
    requiresNote: false,
    requiresSecondPerson: false,
    label: "Resume",
    hint: "Starts issuing codes again.",
  },
  end: {
    from: ["LIVE", "SCHEDULED", "PAUSED"],
    to: "ENDED",
    permission: "promos.manage",
    requiresNote: true,
    requiresSecondPerson: false,
    label: "End now",
    hint: "Closes the offer for good. Existing codes stay valid.",
  },
  reopen: {
    from: ["ENDED"],
    to: "DRAFT",
    permission: "promos.manage",
    requiresNote: false,
    requiresSecondPerson: false,
    label: "Reopen as draft",
    hint: "Copies it back to draft for another round of review.",
  },
};

export const PROMOTION_STATUS_LABEL: Record<PromotionStatus, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  SCHEDULED: "Scheduled",
  LIVE: "Live",
  PAUSED: "Paused",
  ENDED: "Ended",
};

export const PROMOTION_STATUS_STYLE: Record<PromotionStatus, string> = {
  DRAFT: "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
  IN_REVIEW: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  SCHEDULED: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  LIVE: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  PAUSED: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  ENDED: "bg-stone-100 text-stone-500 dark:bg-stone-900 dark:text-stone-500",
};

export const PROMOTION_STATUS_ORDER: PromotionStatus[] = [
  "DRAFT",
  "IN_REVIEW",
  "SCHEDULED",
  "LIVE",
  "PAUSED",
  "ENDED",
];

/**
 * Where an approved or resumed promotion actually lands.
 *
 * Not a fixed `to`, because "approved" means different things depending on the
 * dates: an offer starting next Monday is SCHEDULED, one with no start date is
 * LIVE immediately, and one whose end date has already passed is ENDED rather
 * than briefly live. Deciding this here rather than in the route means the
 * approve and resume paths cannot drift apart.
 */
export function resolveApprovedStatus(
  p: { startsAt: Date | null; endsAt: Date | null },
  now = new Date(),
): PromotionStatus {
  if (p.endsAt && p.endsAt <= now) return "ENDED";
  if (p.startsAt && p.startsAt > now) return "SCHEDULED";
  return "LIVE";
}

/**
 * The commercial terms. Changing any of these after approval changes the deal
 * for anyone already holding a code, so they are locked once a promotion
 * leaves DRAFT — see commercialEditBlocked.
 */
/* maxClaims and endsAt are deliberately NOT here. Both get value-aware
   treatment in commercialEditBlocked — raising a cap and extending a deadline
   only ever help the person holding a code, so they stay allowed on a live
   offer while lowering and shortening are refused. Listing them here would
   make the blanket ban fire first and the value check unreachable. */
export const COMMERCIAL_FIELDS = [
  "discountType",
  "discountValue",
  "currency",
  "startsAt",
  "codePrefix",
] as const;

/**
 * Whether this edit is allowed in this state, and why not if it isn't.
 *
 * DRAFT: anything.
 * IN_REVIEW: anything, but see resetsReview — a commercial change invalidates
 *   the review it is currently under, exactly as a content edit resets a
 *   page's workflow stage.
 * LIVE / SCHEDULED / PAUSED: copy yes, terms no. Two exceptions that can only
 *   ever help the holder — a later end date and a bigger cap — are allowed,
 *   which is why endsAt and maxClaims get value-aware treatment rather than a
 *   flat ban.
 * ENDED: nothing.
 */
export function commercialEditBlocked(
  status: PromotionStatus,
  current: { maxClaims: number | null; endsAt: Date | null },
  incoming: Record<string, unknown>,
): string | null {
  if (status === "DRAFT" || status === "IN_REVIEW") return null;
  if (status === "ENDED") {
    return "This offer has ended. Reopen it as a draft to make changes.";
  }

  for (const f of COMMERCIAL_FIELDS) {
    if (f in incoming && incoming[f] !== undefined) {
      return `${f} cannot change once an offer is approved — people already hold codes on these terms. Pause it and reopen as a draft instead.`;
    }
  }

  // Raising a cap only ever adds codes; lowering it could strand claims.
  if ("maxClaims" in incoming) {
    const next = incoming.maxClaims as number | null;
    if (next !== null && current.maxClaims !== null && next < current.maxClaims) {
      return "You can raise the code limit on a live offer, but not lower it.";
    }
  }
  // Likewise: extending is a gift, shortening breaks a promise.
  if ("endsAt" in incoming) {
    const next = incoming.endsAt ? new Date(incoming.endsAt as string) : null;
    if (next && current.endsAt && next < current.endsAt) {
      return "You can extend a live offer, but not shorten it. Use End now instead.";
    }
  }
  return null;
}

/** Does this edit invalidate a review in progress? */
export function resetsReview(
  status: PromotionStatus,
  incoming: Record<string, unknown>,
): boolean {
  if (status !== "IN_REVIEW") return false;
  return COMMERCIAL_FIELDS.some((f) => f in incoming && incoming[f] !== undefined);
}

/**
 * Actions available on this promotion to this user.
 *
 * `isAuthor` is passed rather than derived so the caller — which already has
 * the row and the session — stays the single place that knows who wrote it.
 */
export function availablePromotionActions(
  status: PromotionStatus,
  opts: { can: (p: Permission) => boolean; isAuthor: boolean },
): PromotionAction[] {
  return (Object.keys(PROMOTION_RULES) as PromotionAction[]).filter((action) => {
    const rule = PROMOTION_RULES[action];
    if (!rule.from.includes(status)) return false;
    if (!opts.can(rule.permission)) return false;
    // Hidden rather than shown-and-rejected: offering a button that always
    // fails is worse than not offering it.
    if (rule.requiresSecondPerson && opts.isAuthor) return false;
    return true;
  });
}
