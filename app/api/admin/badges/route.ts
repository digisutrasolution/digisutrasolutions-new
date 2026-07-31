import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { userCan, leadScopeWhere } from "@/lib/auth/rbac";
import { db } from "@/lib/db";

/** Sidebar badge counts — each figure only for users allowed to act on it. */
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  // End of today (local server time) — a follow-up counts as "due" once its
  // time is today or already past.
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [newLeads, pendingComments, dueFollowups] = await Promise.all([
    userCan(user, "leads.manage")
      ? db.lead.count({ where: { status: "NEW", ...leadScopeWhere(user) } })
      : Promise.resolve(0),
    userCan(user, "comments.moderate")
      ? db.blogComment.count({ where: { status: "PENDING" } })
      : Promise.resolve(0),
    userCan(user, "leads.manage")
      ? db.followUp.count({
          where: {
            ownerId: user.id,
            status: "PENDING",
            dueAt: { lte: endOfToday },
            lead: { deletedAt: null },
          },
        })
      : Promise.resolve(0),
  ]);

  return NextResponse.json({ ok: true, newLeads, pendingComments, dueFollowups });
}
