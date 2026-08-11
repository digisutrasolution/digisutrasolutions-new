import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { userCan } from "@/lib/auth/rbac";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/rate-limit";
import {
  PROMOTION_RULES,
  resolveApprovedStatus,
  type PromotionAction,
} from "@/lib/promotions-workflow";

/* The only route allowed to move a promotion between states.

   Status is deliberately absent from PromotionSchema, so PATCH cannot set it.
   Every state change comes through here, where the transition is legal for the
   current state, the permission is checked, the author-vs-approver rule is
   applied and the whole thing is audited. One door, and it is watched. */

type Params = { params: Promise<{ id: string }> };

const Body = z.object({
  action: z.string().min(1).max(40),
  note: z.string().trim().max(500).optional(),
});

export async function POST(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  const { id } = await params;

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const action = parsed.data.action as PromotionAction;
  const rule = PROMOTION_RULES[action];
  if (!rule) {
    return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
  }

  const promo = await db.promotion.findUnique({
    where: { id },
    select: {
      id: true, name: true, status: true, createdById: true,
      startsAt: true, endsAt: true,
    },
  });
  if (!promo) {
    return NextResponse.json({ ok: false, error: "Offer not found." }, { status: 404 });
  }

  if (!userCan(user, rule.permission)) {
    return NextResponse.json(
      { ok: false, error: "You do not have permission for that." },
      { status: 403 },
    );
  }

  /* Checked against the CURRENT state, not the one the browser thought it was
     in. Two people on the same screen cannot both approve. */
  if (!rule.from.includes(promo.status)) {
    return NextResponse.json(
      { ok: false, error: `Cannot ${rule.label.toLowerCase()} an offer that is ${promo.status.toLowerCase()}.` },
      { status: 409 },
    );
  }

  /* Four eyes. promos.manage and promos.approve are both Super Admin today, so
     a role check alone would let the author wave their own discount through —
     the exact thing the review step exists to stop. */
  if (rule.requiresSecondPerson && promo.createdById && promo.createdById === user.id) {
    return NextResponse.json(
      {
        ok: false,
        error: "You wrote this offer, so someone else has to approve it.",
      },
      { status: 403 },
    );
  }

  const note = parsed.data.note?.trim() || "";
  if (rule.requiresNote && !note) {
    return NextResponse.json(
      { ok: false, error: "Please say why — this note is kept on the offer." },
      { status: 400 },
    );
  }

  // `to: null` means the target depends on the dates — approve and resume both
  // land wherever resolveApprovedStatus says, so they cannot drift apart.
  const to = rule.to ?? resolveApprovedStatus(promo);

  const updated = await db.promotion
    .update({
      where: { id },
      data: {
        status: to,
        statusNote: note || null,
        ...(action === "approve"
          ? { approvedById: user.id, approvedAt: new Date() }
          : {}),
        // Reopening starts a fresh cycle, so the old sign-off is cleared
        // rather than left implying this version was ever approved.
        ...(action === "reopen" ? { approvedById: null, approvedAt: null } : {}),
      },
      select: { id: true, status: true, name: true },
    })
    .catch(() => null);

  if (!updated) {
    return NextResponse.json({ ok: false, error: "Could not update the offer." }, { status: 500 });
  }

  audit({
    userId: user.id,
    action: `promotion.${action}`,
    entity: "promotion",
    entityId: id,
    meta: { from: promo.status, to: updated.status, name: promo.name, ...(note ? { note } : {}) },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, status: updated.status });
}
