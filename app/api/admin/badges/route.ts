import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { userCan, leadScopeWhere } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { getMenuHealth, totalBroken } from "@/lib/menu-check";

/** Sidebar badge counts — each figure only for users allowed to act on it. */
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  // End of today (local server time) — a follow-up counts as "due" once its
  // time is today or already past.
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [newLeads, pendingComments, dueFollowups, brokenLinks] = await Promise.all([
    userCan(user, "leads.manage")
      ? db.lead.count({
          // deletedAt matters: leads are soft-deleted, so without this the
          // badge keeps counting a lead the list no longer shows.
          where: { status: "NEW", deletedAt: null, ...leadScopeWhere(user) },
        })
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
    // Broken menu links from the last sweep — read from the stored summary, so
    // the badge never costs a live crawl on every 60s poll.
    userCan(user, "menus.manage")
      ? getMenuHealth().then(totalBroken)
      : Promise.resolve(0),
  ]);

  return NextResponse.json({
    ok: true,
    newLeads,
    pendingComments,
    dueFollowups,
    brokenLinks,
  });
}
